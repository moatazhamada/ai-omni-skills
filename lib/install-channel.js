import { basename, delimiter, resolve } from 'node:path';
import { realpathSync } from 'node:fs';

export const CHANNEL_NPM = 'npm';
export const CHANNEL_HOMEBREW = 'homebrew';
export const CHANNEL_WINGET = 'winget';
export const CHANNEL_DIRECT_BINARY = 'direct-binary';
export const CHANNEL_UNKNOWN = 'unknown';

const GITHUB_RELEASES_URL =
  'https://github.com/moatazhamada/ai-omni-skills/releases';

function normalizePath(p) {
  if (!p) return '';
  // Normalize Windows backslashes for simpler matching.
  return p.replace(/\\/g, '/').toLowerCase();
}

/**
 * Classify a binary path (the actual executable on disk) into an install
 * channel. This is used both for the running process and when scanning PATH.
 */
export function classifyBinaryPath(binaryPath) {
  const normalized = normalizePath(binaryPath);

  if (normalized.includes('/node_modules/ai-omni-skills/')) {
    return CHANNEL_NPM;
  }

  if (
    normalized.includes('/cellar/omni-skills/') ||
    (normalized.includes('/home/linuxbrew/') && normalized.includes('/omni-skills/'))
  ) {
    return CHANNEL_HOMEBREW;
  }

  if (
    normalized.includes('windowsapps') ||
    normalized.includes('winget') ||
    normalized.includes('/program files/omni-skills/') ||
    normalized.includes('/program files (x86)/omni-skills/')
  ) {
    return CHANNEL_WINGET;
  }

  return CHANNEL_DIRECT_BINARY;
}

/**
 * Detect how the currently running omni-skills was installed.
 *
 * - npm: running under Node/Bun from inside the published package (global
 *   node_modules or local dev).
 * - homebrew: native binary inside a Homebrew Cellar path.
 * - winget: native binary inside a Windows Package Manager path.
 * - direct-binary: any other standalone native binary.
 */
export function detectInstallChannel(options = {}) {
  const argv0 = options.argv0 ?? process.argv[0] ?? '';
  const argv1 = options.argv1 ?? process.argv[1] ?? '';
  const execPath = options.execPath ?? process.execPath ?? '';
  const envCompiled = options.envCompiled ?? process.env.OMNI_SKILLS_COMPILED;

  const entryScript = argv1 || '';
  const normalizedEntry = normalizePath(entryScript);

  // npm install: the CLI is invoked through Node/Bun and the entry script lives
  // inside the ai-omni-skills package. This covers both global npm installs and
  // `npm link` / local development.
  const isJsRuntime = /^(node|node\.exe|bun|bun\.exe)$/i.test(basename(execPath));
  if (isJsRuntime && normalizedEntry.includes('/ai-omni-skills/')) {
    return CHANNEL_NPM;
  }

  // For native binaries, inspect the executable's real path. If the path does
  // not exist (e.g. in tests or unusual launchers), fall back to the unresolved
  // argv0 so classification still works for known package-manager paths.
  try {
    const resolved = realpathSync(argv0);
    return classifyBinaryPath(resolved);
  } catch {
    return classifyBinaryPath(argv0);
  }
}

/**
 * Backward-compatible install-type helpers used by older code.
 */
export function getInstallType() {
  const channel = detectInstallChannel();
  if (channel === CHANNEL_NPM) return CHANNEL_NPM;
  return 'compiled';
}

export function isCompiledBinary() {
  return detectInstallChannel() !== CHANNEL_NPM;
}

export function isNpmInstall() {
  return detectInstallChannel() === CHANNEL_NPM;
}

/**
 * Return the upgrade command or instruction for a given install channel.
 */
export function getUpdateInstruction(channel) {
  const ch = channel ?? detectInstallChannel();
  switch (ch) {
    case CHANNEL_NPM:
      return 'npm install -g ai-omni-skills@latest';
    case CHANNEL_HOMEBREW:
      return 'brew upgrade omni-skills';
    case CHANNEL_WINGET:
      return 'winget upgrade omni-skills';
    case CHANNEL_DIRECT_BINARY:
    default:
      return `Download the latest binary from ${GITHUB_RELEASES_URL}`;
  }
}

/**
 * Return a short human label for an install channel.
 */
export function getInstallChannelLabel(channel) {
  const ch = channel ?? detectInstallChannel();
  switch (ch) {
    case CHANNEL_NPM:
      return 'npm package';
    case CHANNEL_HOMEBREW:
      return 'Homebrew formula';
    case CHANNEL_WINGET:
      return 'Winget package';
    case CHANNEL_DIRECT_BINARY:
      return 'native binary';
    default:
      return 'unknown';
  }
}

/**
 * Expose PATH delimiter for cross-platform scanning.
 */
export function getPathDelimiter() {
  return delimiter;
}
