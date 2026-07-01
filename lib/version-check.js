import { join } from 'node:path';
import {
  CURRENT_VERSION,
  detectInstallChannel,
  getInstallChannelLabel,
  getUpdateInstruction,
} from './version.js';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/ai-omni-skills';
const CACHE_FILE = join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.omni-skills-version-check');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function parseVersion(v) {
  return v.replace(/^v/, '').split('.').map(Number);
}

function compareVersion(a, b) {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (av[i] > bv[i]) return 1;
    if (av[i] < bv[i]) return -1;
  }
  return 0;
}

function isMajorBehind(current, latest) {
  const cv = parseVersion(current);
  const lv = parseVersion(latest);
  return lv[0] > cv[0];
}

function isMinorBehind(current, latest) {
  const cv = parseVersion(current);
  const lv = parseVersion(latest);
  return lv[0] > cv[0] || (lv[0] === cv[0] && lv[1] > cv[1]);
}

export async function checkForUpdates(options = {}) {
  const { silent = false, force = false } = options;

  if (!force) {
    try {
      const cache = readFileSync(CACHE_FILE, 'utf8');
      const { timestamp, version } = JSON.parse(cache);
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        // Use cached result
        return { latest: version, current: CURRENT_VERSION, cached: true };
      }
    } catch {
      // No cache or invalid cache, proceed with fetch
    }
  }

  try {
    const response = await fetch(NPM_REGISTRY_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const latest = data['dist-tags']?.latest;

    if (!latest) {
      throw new Error('No latest version found');
    }

    // Write cache
    try {
      const fs = await import('node:fs');
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), version: latest }));
    } catch {
      // Cache write failure is non-fatal
    }

    return { latest, current: CURRENT_VERSION, cached: false };
  } catch (err) {
    if (!silent) {
      console.log('Could not check for updates. (offline or npm unreachable)');
    }
    return { latest: null, current: CURRENT_VERSION, error: err.message };
  }
}

export async function showUpdateStatus(options = {}) {
  const { silent = false } = options;

  const result = await checkForUpdates(options);
  if (result.error) return;

  const { latest, current } = result;
  if (!latest) return;

  const cmp = compareVersion(current, latest);

  const channel = detectInstallChannel();
  const channelLabel = getInstallChannelLabel(channel);

  if (cmp === 0) {
    if (!silent) {
      console.log(`✅ Omni Skills is up to date (v${current}) — ${channelLabel}`);
    }
    return { status: 'up-to-date', current, latest, channel };
  }

  if (cmp > 0) {
    if (!silent) {
      console.log(`🛠️  Development version (v${current}, latest: v${latest})`);
    }
    return { status: 'ahead', current, latest };
  }

  // Behind
  const major = isMajorBehind(current, latest);
  const minor = isMinorBehind(current, latest);

  if (!silent) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (major) {
      console.log('  🔴 MAJOR UPDATE AVAILABLE');
    } else if (minor) {
      console.log('  🟡 MINOR UPDATE AVAILABLE');
    } else {
      console.log('  🟢 PATCH UPDATE AVAILABLE');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Current:  v${current}`);
    console.log(`  Latest:   v${latest}`);
    console.log(`  Channel:  ${channelLabel}`);
    console.log('');
    console.log(`  Update:   ${getUpdateInstruction(channel)}`);
    console.log('  Changelog: https://github.com/moatazhamada/ai-omni-skills/blob/main/CHANGELOG.md');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (major) {
      console.log('⚠️  This is a MAJOR version update. It may include breaking changes.');
      console.log('   Review the changelog before updating.');
      console.log('');
    }
  }

  return { status: major ? 'major-behind' : minor ? 'minor-behind' : 'patch-behind', current, latest, major, channel };
}

export async function showVersion() {
  console.log(`Omni Skills v${CURRENT_VERSION}`);
  await showUpdateStatus({ silent: true });
}

export async function checkAndWarnOnStartup() {
  // Only show warning for major updates, or if explicitly configured
  const result = await checkForUpdates({ silent: true });
  if (result.error || !result.latest) return;

  const { latest, current } = result;
  const cmp = compareVersion(current, latest);
  if (cmp >= 0) return;

  const major = isMajorBehind(current, latest);
  if (major) {
    console.log('');
    console.log('⚠️  MAJOR UPDATE: A new version of Omni Skills is available.');
    console.log('   Run `omni-skills update` for details.');
    console.log('');
  }
}
