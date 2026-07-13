import { execSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPreSyncBackup } from './backup.js';
import { configPath, expandTilde } from './config.js';
import { scanSkills } from './skills.js';
import {
  absPath,
  ensureSymlink,
  moveToTrash,
  parentDir,
  readJson,
  upsertManagedBlock,
  writeJson,
} from './fs-utils.js';
import { wireHooks } from './hooks.js';
import {
  parseSkillMarkdown,
  compileSkillForTool,
  SupportedTool,
  isSupportedTool,
} from './compiler/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANAGED_SKILL_MARKER = '.omni-skills-managed';
const SKILL_RESOURCE_DIRS = ['scripts', 'references', 'assets', 'agents'];

function readText(file) {
  const absFile = absPath(file);
  if (!existsSync(absFile)) return '';
  try {
    return readFileSync(absFile, 'utf8');
  } catch {
    return '';
  }
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

function mapToolNameToSupportedTool(toolName) {
  const directMapping = {
    claude: SupportedTool.CLAUDE,
    cursor: SupportedTool.CURSOR,
    kimi: SupportedTool.KIMI,
    codex: SupportedTool.CODEX,
    gemini: SupportedTool.GEMINI,
    opencode: SupportedTool.OPEN_CODE,
    kilocode: SupportedTool.KILO_CODE,
  }[toolName.toLowerCase()];

  if (directMapping !== undefined) {
    return directMapping;
  }

  // Fallback: try to match against the SupportedTool enum values directly.
  if (isSupportedTool(toolName.toLowerCase())) {
    return toolName.toLowerCase();
  }

  return null;
}

function wireInstruction(toolName, tool, sharedFile, dryRun) {
  const actions = [];
  const mode = tool.instructionMode;
  const rawInstructionFile = tool.instructionFile;
  if (rawInstructionFile == null) {
    return actions;
  }
  const instructionFile = absPath(rawInstructionFile);
  const absShared = absPath(sharedFile);

  if (mode === 'symlink') {
    actions.push(ensureSymlink(instructionFile, absShared, { dryRun }));
  } else if (mode === 'import') {
    let content = readText(instructionFile);
    const importLine = `@${absShared}`;
    if (content.includes(importLine)) {
      actions.push(`import already present in ${instructionFile}`);
    } else {
      const prefix = `${importLine}\n\n`;
      if (dryRun) {
        actions.push(`would prepend import line to ${instructionFile}`);
      } else {
        parentDir(instructionFile);
        writeFileSync(instructionFile, prefix + content, 'utf8');
        actions.push(`prepended import line to ${instructionFile}`);
      }
    }
  } else if (mode === 'opencode-instructions') {
    const obj = readJson(instructionFile);
    obj.instructions ??= [];
    if (!Array.isArray(obj.instructions)) {
      obj.instructions = [obj.instructions];
    }
    if (obj.instructions.includes(absShared)) {
      actions.push(`instructions already include ${absShared}`);
    } else {
      obj.instructions.push(absShared);
      actions.push(writeJson(instructionFile, obj, { dryRun }));
    }
  }

  return actions;
}

function runSkillSpector(skill, config) {
  const skillSpectorConfig = config.skillSpector;
  if (!skillSpectorConfig?.enabled) return null;

  const command = skillSpectorConfig.command;
  if (!command) {
    console.warn('[skill-spector] enabled but no command configured; skipping scan');
    return null;
  }

  try {
    const output = execSync(`${command} "${skill.file}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { passed: true, output };
  } catch (error) {
    const stderr = error.stderr?.toString() ?? '';
    const stdout = error.stdout?.toString() ?? '';
    return {
      passed: false,
      output: `${stdout}\n${stderr}`.trim(),
    };
  }
}

function compileSkillForTargetTool(skill, targetTool, config) {
  const skillMarkdownContent = readFileSync(skill.file, 'utf8');

  const skillSpectorResult = runSkillSpector(skill, config);
  if (skillSpectorResult && !skillSpectorResult.passed) {
    throw new Error(
      `SkillSpector blocked "${skill.name}":\n${skillSpectorResult.output}`
    );
  }

  const parsedSkill = parseSkillMarkdown(skillMarkdownContent, {
    filePath: skill.file,
  });
  const compiledOutput = compileSkillForTool(
    parsedSkill.config,
    parsedSkill.body,
    targetTool
  );
  return {
    compiledOutput,
    hasFrontmatter: parsedSkill.hasFrontmatter,
  };
}

function removeManagedSkillEntry(skillPath, skillName, config, dryRun) {
  const actions = [];
  if (!existsSync(skillPath)) return actions;

  const stat = lstatSync(skillPath);
  if (stat.isSymbolicLink()) {
    let real;
    try {
      real = realpathSync(skillPath);
    } catch {
      real = null;
    }

    let linkTarget;
    try {
      linkTarget = readlinkSync(skillPath);
    } catch {
      linkTarget = null;
    }

    const resolvedTarget = linkTarget ? resolve(dirname(skillPath), linkTarget) : null;
    const isOurs = config.skillPaths.some((sp) => {
      const absSp = absPath(sp);
      return resolvedTarget?.startsWith(absSp) || real?.startsWith(absSp);
    });

    if (isOurs) {
      if (dryRun) {
        actions.push(`would move managed symlink ${skillPath} to trash`);
      } else {
        moveToTrash(skillPath);
        actions.push(`moved managed symlink ${skillPath} to trash`);
      }
    }
  } else if (stat.isDirectory()) {
    if (isManagedCompiledSkillDir(skillPath)) {
      if (dryRun) {
        actions.push(`would move compiled skill directory ${skillPath} to trash`);
      } else {
        moveToTrash(skillPath);
        actions.push(`moved compiled skill directory ${skillPath} to trash`);
      }
    }
  }

  return actions;
}

function compiledSkillUpToDate(skillPath, compiledOutput, skill) {
  const skillMarkdownPath = join(skillPath, 'SKILL.md');
  const markerPath = join(skillPath, MANAGED_SKILL_MARKER);
  if (!existsSync(skillPath) || !existsSync(skillMarkdownPath) || !existsSync(markerPath)) {
    return false;
  }
  try {
    const existing = readFileSync(skillMarkdownPath, 'utf8');
    if (existing !== compiledOutput.markdownContent) return false;

    for (const resourceDir of SKILL_RESOURCE_DIRS) {
      const source = join(skill.dir, resourceDir);
      const destination = join(skillPath, resourceDir);
      if (existsSync(source) !== existsSync(destination)) return false;
      if (!existsSync(source)) continue;
      if (!lstatSync(destination).isSymbolicLink()) return false;
      if (realpathSync(destination) !== realpathSync(source)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isManagedCompiledSkillDir(skillPath) {
  if (!existsSync(skillPath) || !lstatSync(skillPath).isDirectory()) return false;
  if (existsSync(join(skillPath, MANAGED_SKILL_MARKER))) return true;

  // Recognize compiled directories created before the management marker existed.
  const skillMarkdownPath = join(skillPath, 'SKILL.md');
  if (!existsSync(skillMarkdownPath)) return false;
  try {
    return readFileSync(skillMarkdownPath, 'utf8').startsWith(
      '<!-- Auto-generated by Omni Skills for '
    );
  } catch {
    return false;
  }
}

function writeCompiledSkill(skillPath, compiledOutput, skill, dryRun) {
  const actions = [];

  if (compiledSkillUpToDate(skillPath, compiledOutput, skill)) {
    actions.push(`compiled skill already up-to-date ${skillPath}`);
    return actions;
  }

  if (dryRun) {
    actions.push(`would write compiled skill to ${skillPath}`);
    return actions;
  }

  parentDir(skillPath);
  mkdirSync(skillPath, { recursive: true });

  const skillMarkdownPath = join(skillPath, 'SKILL.md');
  writeFileSync(skillMarkdownPath, compiledOutput.markdownContent, 'utf8');
  actions.push(`wrote compiled skill ${skillMarkdownPath}`);

  writeFileSync(
    join(skillPath, MANAGED_SKILL_MARKER),
    'Managed by Omni Skills. Safe to replace during sync.\n',
    'utf8'
  );

  if (compiledOutput.structuredMetadata !== undefined) {
    if (compiledOutput.structuredMetadata.toml !== undefined) {
      const tomlPath = join(skillPath, 'SKILL.metadata.toml');
      writeFileSync(tomlPath, compiledOutput.structuredMetadata.toml, 'utf8');
      actions.push(`wrote TOML metadata ${tomlPath}`);
    }

    if (compiledOutput.structuredMetadata.json !== undefined) {
      const jsonPath = join(skillPath, 'SKILL.metadata.json');
      writeFileSync(
        jsonPath,
        JSON.stringify(compiledOutput.structuredMetadata.json, null, 2),
        'utf8'
      );
      actions.push(`wrote JSON metadata ${jsonPath}`);
    }
  }

  for (const resourceDir of SKILL_RESOURCE_DIRS) {
    const source = join(skill.dir, resourceDir);
    if (!existsSync(source)) continue;
    const destination = join(skillPath, resourceDir);
    actions.push(ensureSymlink(destination, source, { dryRun }));
  }

  return actions;
}

function wireSkillsDir(toolName, tool, config, dryRun) {
  const actions = [];
  if (tool.skillsDir == null) return actions;

  const supportedTool = mapToolNameToSupportedTool(toolName);
  if (supportedTool === null) {
    console.warn(`[${toolName}] unsupported tool for skill compilation; skipping skills directory`);
    return actions;
  }

  // Support multiple skills directories per tool (e.g., Kimi CLI uses ~/.kimi-code/skills/)
  const dirs = Array.isArray(tool.skillsDir) ? tool.skillsDir : [tool.skillsDir];
  const skills = scanSkills(config);
  const skillMap = new Map(skills.map((s) => [s.name, s]));

  for (const dirTemplate of dirs) {
    const skillsDir = absPath(dirTemplate);
    parentDir(skillsDir);

    if (existsSync(skillsDir)) {
      let entries;
      try {
        entries = readdirSync(skillsDir, { withFileTypes: true });
      } catch {
        entries = [];
      }

      for (const entry of entries) {
        const name = entry.name;
        if (name.startsWith('.') || name === '.skills-bak') continue;
        const entryPath = join(skillsDir, name);

        if (entry.isDirectory()) {
          if (!skillMap.has(name)) {
            console.warn(`[${toolName}] skipping real directory not managed by skills: ${entryPath}`);
          }
          continue;
        }

        if (!entry.isSymbolicLink()) continue;

        actions.push(...removeManagedSkillEntry(entryPath, name, config, dryRun));
      }
    }

    for (const skill of skills) {
      const skillPath = join(skillsDir, skill.name);

      if (
        existsSync(skillPath) &&
        lstatSync(skillPath).isDirectory() &&
        !isManagedCompiledSkillDir(skillPath)
      ) {
        console.warn(
          `[${toolName}] preserving existing unmanaged skill directory: ${skillPath}`
        );
        actions.push(`skipped skill "${skill.name}" because the destination is unmanaged`);
        continue;
      }

      try {
        const { compiledOutput, hasFrontmatter } = compileSkillForTargetTool(
          skill,
          supportedTool,
          config
        );

        if (!hasFrontmatter) {
          console.info(
            `[${toolName}] skill "${skill.name}" has no frontmatter; using zero-config fallback. ` +
              `Add frontmatter to enable capability boundaries and tool overrides.`
          );
        }

        if (compiledSkillUpToDate(skillPath, compiledOutput, skill)) {
          actions.push(`compiled skill already up-to-date ${skillPath}`);
          continue;
        }

        actions.push(...removeManagedSkillEntry(skillPath, skill.name, config, dryRun));
        actions.push(...writeCompiledSkill(skillPath, compiledOutput, skill, dryRun));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[${toolName}] failed to compile skill "${skill.name}": ${errorMessage}`);
        actions.push(`skipped skill "${skill.name}" due to compile error`);
      }
    }
  }

  return actions;
}

function cleanupLegacyCodexSkills(tool, config, dryRun) {
  const actions = [];
  const legacyDir = absPath(tool.legacySkillsDir ?? '~/.codex/skills');
  const configuredDirs = (Array.isArray(tool.skillsDir) ? tool.skillsDir : [tool.skillsDir])
    .filter(Boolean)
    .map(absPath);

  // An explicit legacy target is an opt-out from automatic cleanup.
  if (configuredDirs.includes(legacyDir) || !existsSync(legacyDir)) return actions;

  let entries;
  try {
    entries = readdirSync(legacyDir, { withFileTypes: true });
  } catch {
    return actions;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const entryPath = join(legacyDir, entry.name);
    const cleanupActions = removeManagedSkillEntry(
      entryPath,
      entry.name,
      config,
      dryRun
    );
    for (const action of cleanupActions) {
      actions.push(`legacy cleanup: ${action}`);
    }
  }

  return actions;
}

function wireMcp(toolName, tool, config, dryRun) {
  const actions = [];
  const mcp = tool.mcp;
  if (!mcp) return actions;

  const serverName = config.mcpServerName;
  const command = config.mcpCommand;
  const absCli = absPath(join(__dirname, '..', 'cli.js'));
  const args = (config.mcpArgs ?? []).map((a) =>
    typeof a === 'string' && a.includes('cli.js') ? absCli : expandTilde(a)
  );
  const mcpPaths = (config.skillPaths ?? []).map(absPath).join(',');
  const resolvedConfigPath = configPath();
  const mcpEnv = {
    MCP_SKILL_PATHS: mcpPaths,
    SKILLS_CONFIG: resolvedConfigPath ?? '',
  };

  if (mcp.format === 'mcpServers') {
    const obj = readJson(mcp.file);
    obj.mcpServers ??= {};
    obj.mcpServers[serverName] = {
      command,
      args,
      env: mcpEnv,
    };
    actions.push(writeJson(mcp.file, obj, { dryRun }));
  } else if (mcp.format === 'codex-toml') {
    const blockText = [
      `[mcp_servers.${tomlString(serverName)}]`,
      `command = ${tomlString(command)}`,
      `args = [${args.map(tomlString).join(', ')}]`,
      `env = { MCP_SKILL_PATHS = ${tomlString(mcpPaths)}, SKILLS_CONFIG = ${tomlString(mcpEnv.SKILLS_CONFIG)} }`,
      '',
    ].join('\n');
    actions.push(
      upsertManagedBlock(
        mcp.file,
        '# >>> skills-mcp >>>',
        '# <<< skills-mcp <<<',
        blockText,
        { dryRun }
      )
    );
  } else if (mcp.format === 'opencode') {
    const obj = readJson(mcp.file);
    obj.mcp ??= {};
    obj.mcp[serverName] = {
      type: 'local',
      command: [command, ...args],
      enabled: true,
      environment: mcpEnv,
    };
    actions.push(writeJson(mcp.file, obj, { dryRun }));
  }

  return actions;
}

function wireAssets(config, dryRun) {
  const actions = [];
  const assets = config.assets ?? [];
  if (assets.length === 0) return actions;

  const resolvedConfigPath = configPath();
  const assetBase = resolvedConfigPath
    ? dirname(resolvedConfigPath)
    : join(__dirname, '..');
  for (const a of assets) {
    const target = expandTilde(a.target);
    const source = join(assetBase, a.source);
    actions.push(ensureSymlink(target, source, { dryRun }));
  }
  return actions;
}

export async function syncTools(config, targetTool, { dryRun, noBackup } = {}) {
  const toolNames = Object.keys(config.tools ?? {});
  let selected;
  if (!targetTool || targetTool === 'all') {
    selected = toolNames;
  } else if (toolNames.includes(targetTool)) {
    selected = [targetTool];
  } else {
    console.error(`Unknown tool: ${targetTool}`);
    console.error(`Valid tools: ${toolNames.join(', ')}`);
    process.exit(1);
  }

  if (!dryRun && !noBackup) {
    const backupDir = createPreSyncBackup(config);
    if (backupDir) {
      console.log(`\n[backup] created pre-sync backup at ${backupDir}`);
    }
  }

  for (const name of selected) {
    const tool = config.tools[name];
    console.log(`\n[${name}]`);
    const actions = [];
    actions.push(...wireInstruction(name, tool, config.sharedFile, dryRun));
    actions.push(...wireSkillsDir(name, tool, config, dryRun));
    if (name.toLowerCase() === 'codex') {
      actions.push(...cleanupLegacyCodexSkills(tool, config, dryRun));
    }
    actions.push(...wireMcp(name, tool, config, dryRun));
    actions.push(...wireHooks(name, tool, config, dryRun));
    for (const a of actions) console.log(`  ${a}`);
  }

  const assetActions = wireAssets(config, dryRun);
  if (assetActions.length) {
    console.log(`\n[assets]`);
    for (const a of assetActions) console.log(`  ${a}`);
  }
}
