import { existsSync, mkdirSync, readFileSync, writeFileSync, lstatSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { expandTilde } from './config.js';
import { AI_TOOL_DIRS, INSTRUCTION_PATTERNS, SKILL_DIR_NAMES } from './discover.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return expanded.startsWith('/') ? expanded : join(process.cwd(), expanded);
}

// Reuse discover logic

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

function findInstructionFiles(root, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  const absRoot = absPath(root);
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
      if (SKILL_DIR_NAMES.includes(entry.name.toLowerCase())) {
        const skillFiles = findSkillFiles(join(absRoot, entry.name));
        if (skillFiles.length > 0) {
          results.push({
            path: join(absRoot, entry.name),
            name: entry.name,
            depth: currentDepth,
            type: 'skill-directory',
            skillCount: skillFiles.length,
            skills: skillFiles.slice(0, 10),
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
  const absPathResolved = absPath(dirPath);
  if (!existsSync(absPathResolved)) return skills;

  let entries;
  try {
    entries = readdirSync(absPathResolved, { withFileTypes: true });
  } catch {
    return skills;
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const skillMd = join(absPathResolved, entry.name, 'SKILL.md');
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

export async function runSetup({ publicPath, privatePath, toolkitDir } = {}) {
  console.log('=== Skills Toolkit Setup ===\n');
  console.log('Scanning your system for AI tools, skills, and instruction files...\n');
  console.log('This is a READ-ONLY scan. Nothing will be modified.\n');

  // 1. Detect installed AI tools
  const installedTools = findToolDirs();
  const toolNames = [...new Set(installedTools.map(t => t.tool))];
  
  console.log('--- AI Tools Detected ---');
  if (toolNames.length === 0) {
    console.log('  No AI tools found in standard locations.');
  } else {
    for (const tool of installedTools) {
      console.log(`  ✓ ${tool.name} (${tool.tool})`);
    }
  }
  console.log('');

  // 2. Scan projects for AI files
  const projects = scanProjectsRoot();
  
  console.log('--- Projects with AI Files ---');
  if (projects.length === 0) {
    console.log('  No projects with AI instruction files found.');
  } else {
    for (const proj of projects) {
      console.log(`  ✓ ${proj.name} (${proj.totalAIFiles} files)`);
      for (const instr of proj.instructionFiles.slice(0, 3)) {
        console.log(`    - ${instr.name}`);
      }
      if (proj.instructionFiles.length > 3) {
        console.log(`    ... and ${proj.instructionFiles.length - 3} more`);
      }
    }
  }
  console.log('');

  // 3. Suggest cleanup
  console.log('--- Cleanup Suggestions ---');
  const suggestions = [];
  
  for (const proj of projects) {
    const staleTemplates = proj.instructionFiles.filter(i => {
      try {
        return lstatSync(i.path).size === 1649; // The known stale template size
      } catch { return false; }
    });
    if (staleTemplates.length > 0) {
      suggestions.push({
        type: 'stale-template',
        project: proj.name,
        count: staleTemplates.length,
        action: `skills classify ${proj.path} --dry-run`,
      });
    }
  }
  
  // Find orphaned skills in tool directories
  let orphanedSkills = 0;
  for (const tool of installedTools) {
    const skillPath = join(tool.path, 'skills');
    if (existsSync(skillPath)) {
      const skills = findSkillFiles(skillPath);
      orphanedSkills += skills.length;
    }
  }
  if (orphanedSkills > 0) {
    suggestions.push({
      type: 'orphaned-skills',
      count: orphanedSkills,
      action: 'skills check --move --dry-run',
    });
  }
  
  if (suggestions.length === 0) {
    console.log('  No cleanup suggestions. Your system looks clean!');
  } else {
    for (const s of suggestions) {
      if (s.type === 'stale-template') {
        console.log(`  ⚠️  ${s.project}: ${s.count} stale template(s) detected`);
        console.log(`     Run: ${s.action}`);
      } else if (s.type === 'orphaned-skills') {
        console.log(`  ⚠️  ${s.count} orphaned skill(s) found in tool directories`);
        console.log(`     Run: ${s.action}`);
      }
    }
  }
  console.log('');

  // 4. Determine paths (from args or defaults)
  const resolvedPublic = publicPath || '~/my-skills-public';
  const resolvedPrivate = privatePath || '~/my-skills-private';
  const resolvedToolkit = toolkitDir || '~/Main/Projects/Skills';

  console.log('--- Configuration ---');
  console.log(`  Toolkit:     ${resolvedToolkit}`);
  console.log(`  Public repo: ${resolvedPublic}`);
  console.log(`  Private repo: ${resolvedPrivate}`);
  console.log(`  Tools:       ${toolNames.length > 0 ? toolNames.join(', ') : 'none detected'}`);
  console.log('');

  // 5. Create directories
  console.log('Creating directories...');
  const dirsToCreate = [resolvedPublic, resolvedPrivate];
  for (const dir of dirsToCreate) {
    const abs = absPath(dir);
    if (!existsSync(abs)) {
      mkdirSync(abs, { recursive: true });
      console.log(`  ✓ Created ${dir}`);
    } else {
      console.log(`  ✓ ${dir} already exists`);
    }
  }

  // 6. Create example skill in public repo
  const exampleSkillDir = absPath(join(resolvedPublic, 'example-skill'));
  if (!existsSync(exampleSkillDir)) {
    mkdirSync(exampleSkillDir, { recursive: true });
    writeFileSync(
      join(exampleSkillDir, 'SKILL.md'),
      '---\nname: example-skill\ndescription: A minimal example skill. Replace with your own.\n---\n\n# example-skill\n\nYour instructions here.\n'
    );
    console.log(`  ✓ Created example skill in ${resolvedPublic}/example-skill/`);
  }

  // 7. Create SHARED.md
  // 7. Create SHARED.md
  const sharedPath = absPath(join(resolvedPublic, 'SHARED.md'));
  if (!existsSync(sharedPath)) {
    writeFileSync(sharedPath, '# SHARED.md\n\nThis file contains shared instructions that apply to all AI tools.\nIt is automatically symlinked into each tool\'s global instruction file.\n\nAdd your cross-tool rules here.\n');
    console.log(`  ✓ Created SHARED.md in ${resolvedPublic}/`);
  }

  // 8. Generate config.json
  console.log('\nGenerating config...');
  const configDir = absPath('~/.config/skills');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const configPath = join(configDir, 'config.json');
  const config = generateConfig({
    toolkitDir: resolvedToolkit,
    publicPath: resolvedPublic,
    privatePath: resolvedPrivate,
    tools: toolNames.length > 0 ? toolNames : ['claude', 'codex', 'kimi', 'gemini', 'cursor', 'kilocode'],
  });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  ✓ Created ${configPath}`);

  // 9. Summary
  console.log('\n=== Setup Complete ===');
  console.log(`Config:  ~/.config/skills/config.json`);
  console.log(`Public:  ${resolvedPublic}`);
  console.log(`Private: ${resolvedPrivate}`);
  console.log(`Tools:   ${config.tools ? Object.keys(config.tools).length : 0} configured`);
  console.log('');
  console.log('Next steps:');
  if (suggestions.length > 0) {
    console.log('  1. Review cleanup suggestions above');
    console.log('  2. Run `skills classify <path>` to sort instruction files');
    console.log('  3. Run `skills check --move` to rescue orphaned skills');
  }
  console.log('  Run `skills index` to generate indexes');
  console.log('  Run `skills sync all` to wire into your AI tools');
  console.log('  Run `skills doctor` to verify everything is healthy');
  console.log('  Run `node verify.js` to run the full verification suite');
  console.log('');
  console.log('For more info: https://github.com/moatazhamada/ai-omni-skills');
}

function generateConfig(answers) {
  const toolkitDir = absPath(answers.toolkitDir);
  const publicPath = absPath(answers.publicPath);
  const privatePath = absPath(answers.privatePath);

  const allTools = {
    claude: {
      instructionFile: "~/.claude/CLAUDE.md",
      instructionMode: "import",
      skillsDir: "~/.claude/skills",
      mcp: { file: "~/.claude/.mcp.json", format: "mcpServers" },
      hooks: { file: "~/.claude/settings.json", format: "claude-json" }
    },
    codex: {
      instructionFile: "~/.codex/AGENTS.md",
      instructionMode: "symlink",
      skillsDir: "~/.codex/skills",
      mcp: { file: "~/.codex/config.toml", format: "codex-toml" },
      hooks: { file: "~/.codex/config.toml", format: "codex-toml" }
    },
    kimi: {
      instructionFile: "~/.kimi/AGENTS.md",
      instructionMode: "symlink",
      skillsDir: ["~/.kimi/skills", "~/.kimi-code/skills"],
      mcp: { file: "~/.kimi/mcp.json", format: "mcpServers" },
      hooks: null
    },
    gemini: {
      instructionFile: "~/.gemini/GEMINI.md",
      instructionMode: "symlink",
      skillsDir: null,
      mcp: { file: "~/.gemini/settings.json", format: "mcpServers" },
      hooks: { file: "~/.gemini/settings.json", format: "gemini-json" }
    },
    opencode: {
      instructionFile: "~/.config/opencode/opencode.jsonc",
      instructionMode: "opencode-instructions",
      skillsDir: null,
      mcp: { file: "~/.config/opencode/opencode.jsonc", format: "opencode" },
      hooks: null
    },
    cursor: {
      instructionFile: "~/.cursor/rules/shared-skills.md",
      instructionMode: "symlink",
      skillsDir: null,
      mcp: { file: "~/.cursor/mcp.json", format: "mcpServers" },
      hooks: null
    },
    kilocode: {
      instructionFile: "~/.kilocode/rules/shared-skills.md",
      instructionMode: "symlink",
      skillsDir: "~/.kilocode/skills",
      mcp: { file: "~/Library/Application Support/Code/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json", format: "mcpServers" },
      hooks: null
    },
    aider: {
      instructionFile: "~/.aider.conf.yml",
      instructionMode: "aider-config",
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    continue: {
      instructionFile: "~/.continue/config.yaml",
      instructionMode: "continue-instructions",
      skillsDir: null,
      mcp: { file: "~/.continue/config.yaml", format: "continue" },
      hooks: null
    },
    cline: {
      instructionFile: "~/.cline/rules.md",
      instructionMode: "symlink",
      skillsDir: "~/.cline/skills",
      mcp: { file: "~/.cline/mcp.json", format: "mcpServers" },
      hooks: null
    },
    roo: {
      instructionFile: "~/.roo/rules.md",
      instructionMode: "symlink",
      skillsDir: "~/.roo/skills",
      mcp: { file: "~/.roo/mcp.json", format: "mcpServers" },
      hooks: null
    },
    windsurf: {
      instructionFile: "~/.windsurf/rules.md",
      instructionMode: "symlink",
      skillsDir: null,
      mcp: { file: "~/.windsurf/mcp.json", format: "mcpServers" },
      hooks: null
    },
    zed: {
      instructionFile: "~/.config/zed/settings.json",
      instructionMode: "zed-instructions",
      skillsDir: null,
      mcp: { file: "~/.config/zed/settings.json", format: "zed" },
      hooks: null
    },
    tabby: {
      instructionFile: "~/.tabby/config.toml",
      instructionMode: "tabby-config",
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    pearai: {
      instructionFile: "~/.pearai/config.json",
      instructionMode: "pearai-config",
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    void: {
      instructionFile: "~/.void/config.json",
      instructionMode: "void-config",
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    junie: {
      instructionFile: "~/.junie/guidelines.md",
      instructionMode: "symlink",
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    aiassistant: {
      instructionFile: "~/.aiassistant/rules.md",
      instructionMode: "symlink",
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    "claude-desktop": {
      instructionFile: "~/Library/Application Support/Claude/claude_desktop_config.json",
      instructionMode: "claude-desktop-config",
      skillsDir: null,
      mcp: { file: "~/Library/Application Support/Claude/claude_desktop_config.json", format: "claude-desktop" },
      hooks: null
    },
    devin: {
      instructionFile: null,
      instructionMode: null,
      skillsDir: null,
      mcp: null,
      hooks: null
    },
    "factory-droid": {
      instructionFile: null,
      instructionMode: null,
      skillsDir: null,
      mcp: null,
      hooks: null
    }
  };

  let selectedTools;
  if (answers.tools === 'all') {
    selectedTools = allTools;
  } else {
    selectedTools = {};
    for (const tool of answers.tools) {
      if (allTools[tool]) {
        selectedTools[tool] = allTools[tool];
      }
    }
  }

  return {
    toolkitDir: answers.toolkitDir,
    publicPath: answers.publicPath,
    privatePath: answers.privatePath,
    workflowPaths: [join(answers.privatePath, 'workflows')],
    skillPaths: [answers.publicPath, answers.privatePath],
    sharedFile: join(answers.publicPath, 'SHARED.md'),
    indexTargets: [answers.publicPath, answers.privatePath],
    usageLog: "~/.config/skills/usage.jsonl",
    mcpServerName: "skills",
    mcpCommand: "node",
    mcpArgs: [join(answers.toolkitDir, "cli.js"), "mcp"],
    hooks: [
      {
        event: "SessionStart",
        matcher: "startup",
        command: "echo 'Welcome. Call list_skills / read_skill before acting on matching tasks.'"
      }
    ],
    assets: [],
    tools: selectedTools
  };
}
