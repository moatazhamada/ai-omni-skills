import {
  existsSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configPath, expandTilde } from './config.js';
import { scanSkills } from './skills.js';
import {
  absPath,
  ensureSymlink,
  parentDir,
  readJson,
  upsertManagedBlock,
  writeJson,
} from './fs-utils.js';
import { wireHooks } from './hooks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readText(file) {
  const absFile = absPath(file);
  if (!existsSync(absFile)) return '';
  try {
    return readFileSync(absFile, 'utf8');
  } catch {
    return '';
  }
}

function wireInstruction(toolName, tool, sharedFile, dryRun) {
  const actions = [];
  const mode = tool.instructionMode;
  const instructionFile = absPath(tool.instructionFile);
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

function wireSkillsDir(toolName, tool, config, dryRun) {
  const actions = [];
  if (tool.skillsDir == null) return actions;

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
        if (name.startsWith('.')) continue;
        const entryPath = join(skillsDir, name);

        if (entry.isDirectory()) {
          if (!skillMap.has(name)) {
            console.warn(`[${toolName}] skipping real directory not managed by skills: ${entryPath}`);
          }
          continue;
        }

        if (!entry.isSymbolicLink()) continue;

        let real;
        try {
          real = realpathSync(entryPath);
        } catch {
          real = null;
        }

        if (real == null || !existsSync(real)) {
          let linkTarget;
          try {
            linkTarget = readlinkSync(entryPath);
          } catch {
            linkTarget = null;
          }
          const resolvedTarget = linkTarget ? resolve(skillsDir, linkTarget) : null;
          const isOurs = config.skillPaths.some((sp) => {
            const absSp = absPath(sp);
            return resolvedTarget?.startsWith(absSp) || real?.startsWith(absSp);
          });
          if (isOurs) {
            if (dryRun) {
              actions.push(`would remove dangling symlink ${entryPath}`);
            } else {
              rmSync(entryPath);
              actions.push(`removed dangling symlink ${entryPath}`);
            }
          } else {
            actions.push(`left foreign dangling symlink ${entryPath}`);
          }
        }
      }
    }

    for (const skill of skills) {
      const linkPath = join(skillsDir, skill.name);
      const backupPath = join(skillsDir, '.skills-bak', skill.name);
      actions.push(ensureSymlink(linkPath, skill.dir, { dryRun, backupPath }));
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
  const mcpEnv = { MCP_SKILL_PATHS: mcpPaths, SKILLS_CONFIG: configPath() };

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
    const blockText = `[mcp_servers.${serverName}]\ncommand = "${command}"\nargs = ["${args.join('", "')}"]\nenv = { MCP_SKILL_PATHS = "${mcpPaths}", SKILLS_CONFIG = "${mcpEnv.SKILLS_CONFIG}" }\n`;
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
      command: ['node', absCli, 'mcp'],
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

  const assetBase = dirname(configPath());
  for (const a of assets) {
    const target = expandTilde(a.target);
    const source = join(assetBase, a.source);
    actions.push(ensureSymlink(target, source, { dryRun }));
  }
  return actions;
}

export async function syncTools(config, targetTool, { dryRun } = {}) {
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

  for (const name of selected) {
    const tool = config.tools[name];
    console.log(`\n[${name}]`);
    const actions = [];
    actions.push(...wireInstruction(name, tool, config.sharedFile, dryRun));
    actions.push(...wireSkillsDir(name, tool, config, dryRun));
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
