import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { expandTilde } from './config.js';

const HOME = process.env.HOME || process.env.USERPROFILE || '~';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return expanded.startsWith('/') ? expanded : join(process.cwd(), expanded);
}

// All known AI tool directories and their locations
export const AI_TOOL_DIRS = {
  claude: { paths: ['~/.claude'], name: 'Claude Code' },
  codex: { paths: ['~/.codex'], name: 'OpenAI Codex' },
  kimi: { paths: ['~/.kimi'], name: 'Kimi' },
  gemini: { paths: ['~/.gemini'], name: 'Gemini CLI' },
  cursor: { paths: ['~/.cursor'], name: 'Cursor' },
  kilocode: { paths: ['~/.kilocode'], name: 'Kilocode' },
  opencode: { paths: ['~/.config/opencode'], name: 'OpenCode' },
  aider: { paths: ['~/.aider'], name: 'Aider' },
  continue: { paths: ['~/.continue'], name: 'Continue.dev' },
  cline: { paths: ['~/.cline', '~/.config/cline'], name: 'Cline' },
  roo: { paths: ['~/.roo', '~/.config/roo'], name: 'Roo Code' },
  windsurf: { paths: ['~/.windsurf', '~/.codeium/windsurf'], name: 'Windsurf' },
  zed: { paths: ['~/.config/zed'], name: 'Zed' },
  tabby: { paths: ['~/.tabby'], name: 'Tabby' },
  pearai: { paths: ['~/.pearai'], name: 'PearAI' },
  void: { paths: ['~/.void'], name: 'Void' },
  supermaven: { paths: ['~/.supermaven'], name: 'Supermaven' },
  augment: { paths: ['~/.augment'], name: 'Augment Code' },
  codeium: { paths: ['~/.codeium'], name: 'Codeium' },
  copilot: { paths: ['~/.github/copilot'], name: 'GitHub Copilot' },
  junie: { paths: ['~/.junie'], name: 'JetBrains Junie' },
  aiassistant: { paths: ['~/.aiassistant'], name: 'JetBrains AI Assistant' },
  'claude-desktop': { paths: ['~/Library/Application Support/Claude'], name: 'Claude Desktop' },
  devin: { paths: ['~/.devin'], name: 'Devin' },
  'factory-droid': { paths: ['~/.factory-droid'], name: 'Factory Droid' },
  zai: { paths: ['~/.zai', '~/.config/zai'], name: 'Z.AI (GLM 5.2)', note: 'Model API — works through Claude Code, Cline, Zed, or the glm-copilot VS Code extension' },
};

// All known instruction file patterns
export const INSTRUCTION_PATTERNS = [
  'AGENTS.md', 'AGENTS.override.md',
  'CLAUDE.md', 'GEMINI.md', 'CODEX.md', 'KIMI.md', 'CURSOR.md',
  '.cursorrules', '.cursor-rules', '.windsurfrules', '.windsurf-rules',
  '.clinerules', '.clinerules.md', '.roo-rules', '.roorules',
  'CONVENTIONS.md', 'conventions.md',
  'ai-instructions.md', 'instructions.md', 'ai_instructions.md',
  'copilot-instructions.md', '.github/copilot-instructions.md',
  'copilot-instructions.md',
];

// All known skill directories
export const SKILL_DIR_NAMES = ['skills', '.skills', 'ai-skills', 'agent-skills'];

function findToolDirs() {
  const found = [];
  for (const [toolId, toolInfo] of Object.entries(AI_TOOL_DIRS)) {
    for (const pathTemplate of toolInfo.paths) {
      const fullPath = absPath(pathTemplate);
      if (fullPath && existsSync(fullPath)) {
        const stat = lstatSync(fullPath);
        if (stat.isDirectory()) {
          found.push({
            tool: toolId,
            name: toolInfo.name,
            path: fullPath,
            type: 'directory',
          });
        }
      }
    }
  }
  return found;
}

function findInstructionFiles(rootPath, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  const absRoot = absPath(rootPath);
  if (!absRoot || !existsSync(absRoot)) return results;

  const skipDirs = new Set([
    'node_modules', '.git', 'vendor', 'build', 'dist', '.next', '.vercel',
    'coverage', '.turbo', '.cache', 'out', 'target', '.gradle', '.idea',
    '.vscode', '.claude', '.codex', '.kimi', '.gemini', '.cursor', '.kilocode',
    'bin', 'obj', 'tmp', 'temp', '.swc', '.parcel-cache', '.nuxt', '.output',
    'Pods', 'DerivedData', '.build', '__pycache__', '.pytest_cache',
  ]);

  let entries;
  try {
    entries = readdirSync(absRoot, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      // Check if it's a hidden instruction file (like .cursorrules)
      if (INSTRUCTION_PATTERNS.includes(entry.name.toLowerCase()) ||
          INSTRUCTION_PATTERNS.some(p => entry.name.toLowerCase().endsWith(p.toLowerCase()))) {
        results.push({
          path: join(absRoot, entry.name),
          name: entry.name,
          depth: currentDepth,
          type: 'instruction',
        });
      }
      continue;
    }

    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      // Check if this is a skill directory
      if (SKILL_DIR_NAMES.includes(entry.name.toLowerCase())) {
        const skillFiles = findSkillFiles(join(absRoot, entry.name));
        if (skillFiles.length > 0) {
          results.push({
            path: join(absRoot, entry.name),
            name: entry.name,
            depth: currentDepth,
            type: 'skill-directory',
            skillCount: skillFiles.length,
            skills: skillFiles.slice(0, 10), // First 10
          });
        }
      }
      results.push(...findInstructionFiles(join(absRoot, entry.name), maxDepth, currentDepth + 1));
    } else if (entry.isFile()) {
      const lowerName = entry.name.toLowerCase();
      if (INSTRUCTION_PATTERNS.some(p => lowerName === p.toLowerCase() || lowerName.endsWith(p.toLowerCase()))) {
        results.push({
          path: join(absRoot, entry.name),
          name: entry.name,
          depth: currentDepth,
          type: 'instruction',
        });
      }
    }
  }

  return results;
}

function findSkillFiles(dirPath) {
  const skills = [];
  const absPath = expandTilde(dirPath);
  if (!existsSync(absPath)) return skills;

  let entries;
  try {
    entries = readdirSync(absPath, { withFileTypes: true });
  } catch {
    return skills;
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const skillMd = join(absPath, entry.name, 'SKILL.md');
      if (existsSync(skillMd)) {
        skills.push(entry.name);
      }
    }
  }

  return skills;
}

function scanProjectsRoot() {
  const commonRoots = [
    '~/Projects', '~/projects', '~/Work', '~/work', '~/Dev', '~/dev',
    '~/Code', '~/code', '~/Repositories', '~/repos', '~/src', '~/Source',
    '~/Main', '~/main', '~/Development', '~/development',
  ];

  const foundProjects = [];
  for (const root of commonRoots) {
    const absRoot = absPath(root);
    if (!absRoot || !existsSync(absRoot)) continue;

    let entries;
    try {
      entries = readdirSync(absRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const projectPath = join(absRoot, entry.name);
        const instructions = findInstructionFiles(projectPath, 2);
        const skillDirs = instructions.filter(i => i.type === 'skill-directory');
        const instrFiles = instructions.filter(i => i.type === 'instruction');
        
        if (instructions.length > 0) {
          foundProjects.push({
            path: projectPath,
            name: entry.name,
            instructionFiles: instrFiles,
            skillDirectories: skillDirs,
            totalAIFiles: instructions.length,
          });
        }
      }
    }
  }

  return foundProjects;
}

export function runDiscover() {
  console.log('=== Skills Discovery ===\n');
  console.log('Scanning your system for AI tools, instruction files, and skills...\n');

  // 1. Find AI tool directories
  console.log('--- AI Tools Installed ---');
  const tools = findToolDirs();
  if (tools.length === 0) {
    console.log('No AI tool directories found in standard locations.');
  } else {
    for (const tool of tools) {
      console.log(`  ✓ ${tool.name} (${tool.tool})`);
      console.log(`    ${tool.path}`);
      
      // Check for skills subdirectory
      for (const skillDirName of ['skills', '.skills']) {
        const skillPath = join(tool.path, skillDirName);
        if (existsSync(skillPath)) {
          const skillFiles = findSkillFiles(skillPath);
          if (skillFiles.length > 0) {
            console.log(`    └─ ${skillDirName}/: ${skillFiles.length} skill(s)`);
          }
        }
      }
      
      // Check for instruction files
      for (const instrPattern of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'rules.md', 'rules']) {
        const instrPath = join(tool.path, instrPattern);
        if (existsSync(instrPath)) {
          const stat = lstatSync(instrPath);
          console.log(`    └─ ${instrPattern}: ${stat.size} bytes`);
        }
      }
    }
  }
  console.log('');

  // 2. Scan projects
  console.log('--- Projects with AI Files ---');
  const projects = scanProjectsRoot();
  if (projects.length === 0) {
    console.log('No projects with AI instruction files found in common directories.');
  } else {
    for (const proj of projects) {
      console.log(`  ✓ ${proj.name}`);
      console.log(`    ${proj.path}`);
      console.log(`    ${proj.totalAIFiles} AI-related file(s):`);
      
      for (const instr of proj.instructionFiles.slice(0, 5)) {
        const stat = lstatSync(instr.path);
        const isSymlink = stat.isSymbolicLink();
        console.log(`      - ${instr.name} (${stat.size}b${isSymlink ? ', symlink' : ''})`);
      }
      if (proj.instructionFiles.length > 5) {
        console.log(`      ... and ${proj.instructionFiles.length - 5} more`);
      }
      
      for (const skillDir of proj.skillDirectories) {
        console.log(`      - ${skillDir.name}/: ${skillDir.skillCount} skill(s)`);
      }
    }
  }
  console.log('');

  // 3. Check for .aider.conf.yml and CONVENTIONS.md
  console.log('--- Aider Configuration ---');
  const aiderConfig = absPath('~/.aider.conf.yml');
  if (aiderConfig && existsSync(aiderConfig)) {
    console.log(`  ✓ ~/.aider.conf.yml found`);
  } else {
    console.log('  Not found');
  }
  console.log('');

  // 4. Check for Continue.dev
  console.log('--- Continue.dev Configuration ---');
  const continueConfig = absPath('~/.continue/config.yaml');
  const continueConfigJson = absPath('~/.continue/config.json');
  if (continueConfig && existsSync(continueConfig)) {
    console.log(`  ✓ ~/.continue/config.yaml found`);
  } else if (continueConfigJson && existsSync(continueConfigJson)) {
    console.log(`  ✓ ~/.continue/config.json found`);
  } else {
    console.log('  Not found');
  }
  console.log('');

  // 5. Check for Zed
  console.log('--- Zed Configuration ---');
  const zedConfig = absPath('~/.config/zed/settings.json');
  if (zedConfig && existsSync(zedConfig)) {
    console.log(`  ✓ ~/.config/zed/settings.json found`);
  } else {
    console.log('  Not found');
  }
  console.log('');

  // 6. Summary and recommendations
  console.log('=== Summary ===');
  console.log(`AI tools found: ${tools.length}`);
  console.log(`Projects with AI files: ${projects.length}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run `skills setup` to configure the toolkit for your system');
  console.log('  2. Run `skills classify <path>` to sort instruction files into public/private');
  console.log('  3. Run `skills check` to find orphaned skills in tool directories');
  console.log('  4. Run `skills sync all` to wire everything into your AI tools');
  console.log('');
  console.log('For each tool you want to support, add an entry to your config.json');
  console.log('and run `skills sync <tool>`. See config.example.json for all 25 supported tools.');
}
