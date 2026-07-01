import { basename } from 'node:path';
import {
  CHANNEL_DIRECT_BINARY,
  CHANNEL_NPM,
  classifyBinaryPath,
  detectInstallChannel as detectInstallChannelInternal,
  getInstallChannelLabel as getInstallChannelLabelInternal,
  getUpdateInstruction as getUpdateInstructionInternal,
} from './install-channel.js';

/**
 * Static version string. This value is injected at build time for native
 * binaries so the CLI never has to read package.json at runtime.
 */
export const CURRENT_VERSION = '1.5.3';

export function getCurrentVersion() {
  return CURRENT_VERSION;
}

/**
 * Supported installation channels.
 * - 'npm':    Running under Node/Bun from the published package or source.
 * - 'compiled': Running as a standalone native binary (Bun compile, pkg, etc.).
 *
 * @deprecated Use the channel constants from install-channel.js instead.
 */
export const INSTALL_TYPE_NPM = 'npm';
export const INSTALL_TYPE_COMPILED = 'compiled';

/**
 * Detect how the CLI was launched.
 *
 * Compiled binaries set OMNI_SKILLS_COMPILED=1 at build time. As a fallback,
 * we inspect the runtime executable: if it is not a known JS runtime
 * (node/bun), we assume a standalone binary.
 *
 * @deprecated Use detectInstallChannel() for finer-grained detection.
 */
export function getInstallType() {
  return detectInstallChannelInternal() === CHANNEL_NPM
    ? INSTALL_TYPE_NPM
    : INSTALL_TYPE_COMPILED;
}

export function detectInstallChannel(options) {
  return detectInstallChannelInternal(options);
}

export function isCompiledBinary() {
  return detectInstallChannelInternal() !== CHANNEL_NPM;
}

export function isNpmInstall() {
  return detectInstallChannelInternal() === CHANNEL_NPM;
}

const GITHUB_RELEASES_URL =
  'https://github.com/moatazhamada/ai-omni-skills/releases';

/**
 * Return the upgrade instruction appropriate for the current install type.
 */
export function getUpdateInstruction(channel) {
  return getUpdateInstructionInternal(channel);
}

/**
 * Return a short label for the current distribution channel.
 */
export function getInstallChannelLabel(channel) {
  return getInstallChannelLabelInternal(channel);
}

/**
 * Re-export channel classifier for callers that need to inspect a binary path.
 */
export { classifyBinaryPath };
