import { basename } from 'node:path';

/**
 * Static version string. This value is injected at build time for native
 * binaries so the CLI never has to read package.json at runtime.
 */
export const CURRENT_VERSION = '1.5.1';

export function getCurrentVersion() {
  return CURRENT_VERSION;
}

/**
 * Supported installation channels.
 * - 'npm':    Running under Node/Bun from the published package or source.
 * - 'compiled': Running as a standalone native binary (Bun compile, pkg, etc.).
 */
export const INSTALL_TYPE_NPM = 'npm';
export const INSTALL_TYPE_COMPILED = 'compiled';

/**
 * Detect how the CLI was launched.
 *
 * Compiled binaries set OMNI_SKILLS_COMPILED=1 at build time. As a fallback,
 * we inspect the runtime executable: if it is not a known JS runtime
 * (node/bun), we assume a standalone binary.
 */
export function getInstallType() {
  if (process.env.OMNI_SKILLS_COMPILED === '1') {
    return INSTALL_TYPE_COMPILED;
  }

  const executablePath = process.execPath || process.argv[0] || '';
  const executableName = basename(executablePath).toLowerCase();

  const isJavaScriptRuntime =
    executableName === 'node' ||
    executableName === 'node.exe' ||
    executableName === 'bun' ||
    executableName === 'bun.exe';

  return isJavaScriptRuntime ? INSTALL_TYPE_NPM : INSTALL_TYPE_COMPILED;
}

export function isCompiledBinary() {
  return getInstallType() === INSTALL_TYPE_COMPILED;
}

export function isNpmInstall() {
  return getInstallType() === INSTALL_TYPE_NPM;
}

const GITHUB_RELEASES_URL =
  'https://github.com/moatazhamada/ai-omni-skills/releases';

/**
 * Return the upgrade instruction appropriate for the current install type.
 */
export function getUpdateInstruction() {
  return isCompiledBinary()
    ? `Download the latest binary from ${GITHUB_RELEASES_URL}, or run your package manager (brew upgrade omni-skills / winget upgrade omni-skills).`
    : 'npm install -g ai-omni-skills@latest';
}

/**
 * Return a short label for the current distribution channel.
 */
export function getInstallChannelLabel() {
  return isCompiledBinary() ? 'native binary' : 'npm package';
}
