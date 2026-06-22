#!/usr/bin/env node

import { loadConfig } from './lib/config.js';

function parseArgs(argv) {
  const flags = {
    dryRun: argv.includes('--dry-run'),
    move: argv.includes('--move'),
    enhance: argv.includes('--enhance'),
  };

  // Extract --depth=N
  const depthArg = argv.find((a) => a.startsWith('--depth='));
  if (depthArg) {
    const val = parseInt(depthArg.split('=')[1], 10);
    if (!isNaN(val) && val > 0) {
      flags.depth = val;
    }
  }

  // Extract --public=PATH, --private=PATH, --toolkit=PATH
  const publicArg = argv.find((a) => a.startsWith('--public='));
  if (publicArg) flags.publicPath = publicArg.split('=')[1];

  const privateArg = argv.find((a) => a.startsWith('--private='));
  if (privateArg) flags.privatePath = privateArg.split('=')[1];

  const toolkitArg = argv.find((a) => a.startsWith('--toolkit='));
  if (toolkitArg) flags.toolkitDir = toolkitArg.split('=')[1];

  const positional = argv.filter((a) => !a.startsWith('--'));
  return { flags, positional };
}

function showHelp() {
  console.log(`Usage: skills <subcommand> [args] [options]

Subcommands:
  mcp     Run the MCP server over stdio
  index   Regenerate INDEX.md and SHARED.md files
  workflow [list|run <name>]
          List available workflows or run a named workflow.
          Workflows are chainable skill sequences (e.g., lint → test → commit).
  sync [tool|all] [--dry-run]
          Wire instructions, skills dirs, MCP config, hooks, and assets for the
          named tool (or every tool if omitted or 'all'). --dry-run prints planned
          actions.
  check [--move] [--dry-run]
          List agent-created local skills and dangling/foreign symlinks.
          --move relocates detected skills to publicPath unless they look private.
          --dry-run prints planned moves.
  report [--enhance]
          Print usage statistics. --enhance adds heuristic improvement tips.
  classify [path] [--dry-run] [--depth=N]
          Scan a directory for instruction files (AGENTS.md, CLAUDE.md, GEMINI.md,
          etc.), detect sensitive content, and interactively move them to the
          canonical public or private store. Defaults to current directory.
          --depth sets max recursion depth (default: 3).
  discover         Scan your entire system for installed AI tools, instruction files,
          skill directories, and projects with AI configuration. Reports what
          it finds and suggests next steps.
  doctor           Run health checks: verify symlinks, config, indexes, and skills.
  setup [--public=PATH] [--private=PATH] [--toolkit=PATH]
          Auto-scan your system, detect installed AI tools, find instruction files
          and skills, suggest cleanup, and generate ~/.config/skills/config.json.
          No questions asked. Override defaults with flags.
  init [--dry-run]
          Interactive seeker: scan tool skills dirs and known agent locations for
          new skills, classify them public/private/skip, then sync and index.
          --dry-run prints recommendations without prompting or writing.
  help    Show this help message

Config resolves from $SKILLS_CONFIG, then ~/.config/skills/config.json, then the
bundled config.example.json.

Global flags:
  --dry-run   Print planned actions; do not write files or move directories.
  --move      Used with check to relocate detected local skills.
  --enhance   Used with report to add heuristic skill-improvement suggestions.
  --depth=N   Used with classify to set max recursion depth.
  --public=PATH  Override public skills directory for setup.
  --private=PATH Override private skills directory for setup.
  --toolkit=PATH Override toolkit directory for setup.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick start:  omni-skills setup → omni-skills sync all → omni-skills doctor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function main() {
  const cmd = process.argv[2];
  const rest = process.argv.slice(3);
  const { flags, positional } = parseArgs(rest);

  switch (cmd) {
    case 'mcp': {
      const { startMcp } = await import('./mcp.js');
      await startMcp(loadConfig());
      break;
    }
    case 'index': {
      const { buildIndex } = await import('./lib/index-gen.js');
      await buildIndex(loadConfig());
      break;
    }
    case 'workflow': {
      const { scanWorkflows, formatWorkflowList, getWorkflow, validateWorkflowSteps, generateWorkflowPrompt } = await import('./lib/workflows.js');
      const { scanSkills } = await import('./lib/skills.js');
      const config = loadConfig();
      const subcmd = positional[0];
      const wfName = positional[1];
      const workflows = scanWorkflows(config);
      const skills = scanSkills(config);

      if (subcmd === 'list' || !subcmd) {
        console.log(formatWorkflowList(workflows));
      } else if (subcmd === 'run') {
        if (!wfName) {
          console.error('Usage: skills workflow run <name>');
          process.exit(1);
        }
        const wf = getWorkflow(config, wfName);
        if (!wf) {
          console.error(`Workflow "${wfName}" not found.`);
          console.log(formatWorkflowList(workflows));
          process.exit(1);
        }
        const missing = validateWorkflowSteps(wf, skills);
        if (missing.length > 0) {
          console.warn(`Warning: workflow references missing skills: ${missing.join(', ')}`);
        }
        console.log(generateWorkflowPrompt(wf, skills));
      } else {
        console.error(`Unknown workflow subcommand: ${subcmd}`);
        console.log('Usage: skills workflow [list|run <name>]');
        process.exit(1);
      }
      break;
    }
    case 'sync': {
      const { syncTools } = await import('./lib/sync.js');
      await syncTools(loadConfig(), positional[0], { dryRun: flags.dryRun });
      break;
    }
    case 'check': {
      const { checkSkills } = await import('./lib/check.js');
      await checkSkills(loadConfig(), { move: flags.move, dryRun: flags.dryRun });
      break;
    }
    case 'report': {
      const { reportSkills } = await import('./lib/report.js');
      await reportSkills(loadConfig(), { enhance: flags.enhance });
      break;
    }
    case 'classify': {
      const { classifyInstructions } = await import('./lib/classify.js');
      await classifyInstructions(loadConfig(), positional[0], { dryRun: flags.dryRun, depth: flags.depth });
      break;
    }
    case 'doctor': {
      const { runDoctor } = await import('./lib/doctor.js');
      await runDoctor(loadConfig());
      break;
    }
    case 'discover': {
      const { runDiscover } = await import('./lib/discover.js');
      runDiscover();
      break;
    }
    case 'setup': {
      const { runSetup } = await import('./lib/setup.js');
      await runSetup({
        publicPath: flags.publicPath,
        privatePath: flags.privatePath,
        toolkitDir: flags.toolkitDir,
      });
      break;
    }
    case 'init': {
      const { initSkills } = await import('./lib/init.js');
      await initSkills(loadConfig(), { dryRun: flags.dryRun });
      break;
    }
    case 'help':
    case '-h':
    case undefined:
    default:
      showHelp();
      process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
