import { readJson, upsertManagedBlock, writeJson } from './fs-utils.js';

function hasCommand(group, command) {
  if (!Array.isArray(group?.hooks)) return false;
  return group.hooks.some((h) => h?.command === command);
}

function wireJsonHooks(file, hooks, dryRun) {
  const obj = readJson(file);
  obj.hooks ??= {};

  for (const { event, matcher, command } of hooks) {
    obj.hooks[event] ??= [];
    obj.hooks[event] = obj.hooks[event].filter((g) => !hasCommand(g, command));
    obj.hooks[event].push({
      matcher,
      hooks: [{ type: 'command', command }],
    });
  }

  return writeJson(file, obj, { dryRun });
}

function wireTomlHooks(file, hooks, dryRun) {
  const lines = [];
  for (const { event, matcher, command } of hooks) {
    lines.push(`[[hooks.${event}]]`);
    lines.push(`matcher = "${matcher}"`);
    lines.push(`[[hooks.${event}.hooks]]`);
    lines.push(`type = "command"`);
    lines.push(`command = '${command}'`);
  }
  const blockText = lines.join('\n') + '\n';

  return upsertManagedBlock(
    file,
    '# >>> skills-hooks >>>',
    '# <<< skills-hooks <<<',
    blockText,
    { dryRun }
  );
}

export function wireHooks(toolName, tool, config, dryRun) {
  const hookConfig = tool.hooks;
  const canonical = config.hooks ?? [];
  if (!hookConfig || canonical.length === 0) return [];

  const actions = [];
  if (hookConfig.format === 'claude-json' || hookConfig.format === 'gemini-json') {
    actions.push(wireJsonHooks(hookConfig.file, canonical, dryRun));
  } else if (hookConfig.format === 'codex-toml') {
    actions.push(wireTomlHooks(hookConfig.file, canonical, dryRun));
  } else {
    actions.push(`unsupported hook format ${hookConfig.format} for ${toolName}`);
  }

  return actions;
}
