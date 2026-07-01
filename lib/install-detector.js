import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { delimiter, join, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { classifyBinaryPath, getInstallChannelLabel } from './install-channel.js';

function getExecutableName() {
  return process.platform === 'win32' ? 'omni-skills.exe' : 'omni-skills';
}

function isExecutable(filePath) {
  try {
    const stat = lstatSync(filePath);
    if (!stat.isFile() && !stat.isSymbolicLink()) return false;
    if (process.platform === 'win32') return true;
    // On Unix, basic existence in a bin dir plus executable bit is enough.
    return (stat.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

function readVersion(binaryPath) {
  try {
    const output = execFileSync(binaryPath, ['--version'], {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.trim().replace(/^v/i, '');
  } catch {
    return null;
  }
}

/**
 * Find every omni-skills executable visible on PATH.
 *
 * Returns an array of unique installations sorted by PATH precedence:
 *   { path, realPath, channel, channelLabel, version }
 *
 * The first item is the active one (the one that runs when typing
 * `omni-skills`). Shadowed items come later.
 */
export function findOmniSkillsInstallations(envPath = process.env.PATH) {
  if (!envPath) return [];

  const seen = new Set();
  const results = [];
  const name = getExecutableName();

  for (const dir of envPath.split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, name);
    if (!existsSync(candidate)) continue;
    if (!isExecutable(candidate)) continue;

    let realPath;
    try {
      realPath = realpathSync(candidate);
    } catch {
      realPath = candidate;
    }

    if (seen.has(realPath)) continue;
    seen.add(realPath);

    const channel = classifyBinaryPath(realPath);
    const version = readVersion(realPath);

    results.push({
      path: candidate,
      realPath,
      channel,
      channelLabel: getInstallChannelLabel(channel),
      version,
    });
  }

  return results;
}

/**
 * Return the installation that is currently active based on PATH order.
 */
export function getActiveInstallation(installations) {
  return installations[0] ?? null;
}

/**
 * Print a concise report of found installations.
 */
export function reportInstallations(installations) {
  if (installations.length === 0) {
    console.log('  ✗ no omni-skills installation found on PATH');
    return;
  }

  if (installations.length === 1) {
    const inst = installations[0];
    console.log(
      `  ✓ single installation: ${inst.realPath} (${inst.channelLabel}${inst.version ? ` v${inst.version}` : ''})`
    );
    return;
  }

  console.log(`  ⚠ ${installations.length} installations found:`);
  for (let i = 0; i < installations.length; i++) {
    const inst = installations[i];
    const marker = i === 0 ? 'active' : 'shadowed';
    const version = inst.version ? `v${inst.version}` : 'version unknown';
    console.log(`    [${marker}] ${inst.realPath} (${inst.channelLabel}, ${version})`);
  }
}
