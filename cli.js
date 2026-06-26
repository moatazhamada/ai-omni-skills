#!/usr/bin/env node

import { loadConfig } from './lib/config.js';

const SUPPORTED_MAJOR = 1;

// Major version hard block: old major versions must update
async function enforceMajorVersion() {
  const { checkForUpdates } = await import('./lib/version-check.js');
  const { getCurrentVersion, getUpdateInstruction } = await import('./lib/version.js');
  const current = getCurrentVersion();
  const cv = current.split('.').map(Number);
  if (cv[0] < SUPPORTED_MAJOR) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('  🔴 MAJOR VERSION UPDATE REQUIRED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`  Your version: v${current}`);
    console.error(`  Minimum supported: v${SUPPORTED_MAJOR}.x.x`);
    console.error('');
    console.error('  This version is no longer supported.');
    console.error('  Update now:');
    console.error(`    ${getUpdateInstruction()}`);
    console.error('');
    console.error('  Changelog: https://github.com/moatazhamada/ai-omni-skills/blob/main/CHANGELOG.md');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    process.exit(1);
  }
}

function parseArgs(argv) {
  const flags = {
    dryRun: argv.includes('--dry-run'),
    move: argv.includes('--move'),
    enhance: argv.includes('--enhance'),
    yes: argv.includes('--yes') || argv.includes('-y'),
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
  console.log(`Usage: omni-skills <subcommand> [args] [options]

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
  security [scan|install|schedule]
          Check security status of NVIDIA SkillSpector.
          scan: Scan skills for vulnerabilities.
          install [pip|docker]: Install SkillSpector.
          schedule: Show how to set up periodic scanning.
  create [name] [description]
          Create a new skill with interactive wizard.
          Creates SKILL.md template in your skills store.
  create from <path> [name]
          Convert an existing file into a skill.
  update [--check]
          Check for updates. Shows current version and latest from npm.
          --check only: no install prompt, just status.
  version
          Show current version.
  uninstall
          Remove omni-skills, symlinks, and MCP configs. Skills directory is
          protected by default (prompts before deletion).
  uninstall
          Remove omni-skills toolkit integrations.
          Your skills directory is protected by default (must opt-in to delete).
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
  --yes, -y   Skip confirmation prompts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick start:  omni-skills setup → omni-skills sync all → omni-skills doctor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To check for updates: omni-skills update`);
}

async function main() {
  const cmd = process.argv[2];
  const rest = process.argv.slice(3);
  const { flags, positional } = parseArgs(rest);

  // Auto-check for major updates on startup (except for update/help commands)
  if (cmd !== 'update' && cmd !== 'help' && cmd !== undefined) {
    const { checkAndWarnOnStartup } = await import('./lib/version-check.js');
    await checkAndWarnOnStartup();
  }

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
      const { executeWithConsent } = await import('./lib/prompt.js');
      await executeWithConsent(async (runFlags) => {
        await syncTools(loadConfig(), positional[0], { dryRun: runFlags.dryRun });
      }, flags);
      break;
    }
    case 'check': {
      const { checkSkills } = await import('./lib/check.js');
      const { executeWithConsent } = await import('./lib/prompt.js');
      await executeWithConsent(async (runFlags) => {
        await checkSkills(loadConfig(), { move: flags.move, dryRun: runFlags.dryRun });
      }, flags);
      break;
    }
    case 'report': {
      const { reportSkills } = await import('./lib/report.js');
      await reportSkills(loadConfig(), { enhance: flags.enhance });
      break;
    }
    case 'classify': {
      const { classifyInstructions } = await import('./lib/classify.js');
      const { executeWithConsent } = await import('./lib/prompt.js');
      await executeWithConsent(async (runFlags) => {
        await classifyInstructions(loadConfig(), positional[0], { dryRun: runFlags.dryRun, depth: flags.depth });
      }, flags);
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
      const { executeWithConsent } = await import('./lib/prompt.js');
      await executeWithConsent(async (runFlags) => {
        await runSetup({
          publicPath: flags.publicPath,
          privatePath: flags.privatePath,
          toolkitDir: flags.toolkitDir,
          dryRun: runFlags.dryRun
        });
      }, flags);
      break;
    }
    case 'init': {
      const { initSkills } = await import('./lib/init.js');
      const { executeWithConsent } = await import('./lib/prompt.js');
      await executeWithConsent(async (runFlags) => {
        await initSkills(loadConfig(), { dryRun: runFlags.dryRun });
      }, flags);
      break;
    }
    case 'security': {
      const { showSecurityStatus, runSkillSpectorScan, showSecurityBanner, installSkillSpector, showInstallInstructions, showScheduleHelp } = await import('./lib/security.js');
      const config = loadConfig();
      const subcmd = positional[0];
      if (subcmd === 'scan') {
        const target = positional[1] || config.skillsPath || (config.skillPaths ? config.skillPaths[0] : null) || process.cwd();
        showSecurityBanner();
        const output = runSkillSpectorScan(target, {
          noLLM: rest.includes('--no-llm'),
          format: rest.find(a => a.startsWith('--format='))?.split('=')[1],
          output: rest.find(a => a.startsWith('--output='))?.split('=')[1],
          verbose: rest.includes('-V') || rest.includes('--verbose'),
        });
        if (output) console.log(output);
      } else if (subcmd === 'install') {
        const method = positional[1] || 'pip';
        installSkillSpector(method);
      } else if (subcmd === 'schedule') {
        showScheduleHelp();
      } else {
        showSecurityStatus();
      }
      break;
    }
    case 'create': {
      const { createSkill, createSkillFromFile } = await import('./lib/create-skill.js');
      const config = loadConfig();
      const subcmd = positional[0];
      if (subcmd === 'from' && positional[1]) {
        await createSkillFromFile(config, positional[1], {
          name: positional[2],
        });
      } else {
        await createSkill(config, {
          name: positional[0],
          description: positional[1],
          targetDir: config.skillsPath || (config.skillPaths ? config.skillPaths[0] : null),
        });
      }
      break;
    }
    case 'update': {
      const { showUpdateStatus } = await import('./lib/version-check.js');
      const { isCompiledBinary, getUpdateInstruction } = await import('./lib/version.js');
      const checkOnly = rest.includes('--check');
      const result = await showUpdateStatus({ silent: false });
      if (result && result.status !== 'up-to-date' && !checkOnly) {
        if (isCompiledBinary()) {
          console.log('Compiled binary updates are not performed in-place.');
          console.log(`To upgrade: ${getUpdateInstruction()}`);
          break;
        }
        const readline = await import('node:readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise((resolve) => {
          rl.question('Update now? [Y/n] (default: yes): ', resolve);
        });
        rl.close();
        if (answer.trim().toLowerCase() !== 'n' && answer.trim().toLowerCase() !== 'no') {
          const { execSync } = await import('node:child_process');
          const updateCommand = getUpdateInstruction();
          console.log(`Running: ${updateCommand}`);
          try {
            execSync(updateCommand, { stdio: 'inherit' });
          } catch (err) {
            console.error(`Update failed. Try manually: ${updateCommand}`);
            process.exit(1);
          }
        }
      }
      break;
    }
    case 'uninstall': {
      const { uninstall } = await import('./lib/uninstall.js');
      await uninstall(loadConfig());
      break;
    }
    case 'version':
    case '-v':
    case '--version': {
      const { getCurrentVersion } = await import('./lib/version.js');
      console.log('v' + getCurrentVersion());
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

enforceMajorVersion().then(() => main()).catch((err) => {
  console.error(err);
  process.exit(1);
});
