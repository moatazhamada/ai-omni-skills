import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CHANNEL_DIRECT_BINARY,
  CHANNEL_HOMEBREW,
  CHANNEL_NPM,
  CHANNEL_WINGET,
  classifyBinaryPath,
  detectInstallChannel,
  getInstallChannelLabel,
  getUpdateInstruction,
} from '../lib/install-channel.js';

describe('install-channel.js', () => {
  describe('classifyBinaryPath', () => {
    it('detects Homebrew on Apple Silicon Mac', () => {
      assert.strictEqual(
        classifyBinaryPath('/opt/homebrew/Cellar/omni-skills/1.5.0/bin/omni-skills'),
        CHANNEL_HOMEBREW
      );
    });

    it('detects Homebrew on Intel Mac', () => {
      assert.strictEqual(
        classifyBinaryPath('/usr/local/Cellar/omni-skills/1.5.0/bin/omni-skills'),
        CHANNEL_HOMEBREW
      );
    });

    it('detects Homebrew on Linuxbrew', () => {
      assert.strictEqual(
        classifyBinaryPath('/home/linuxbrew/.linuxbrew/Cellar/omni-skills/1.5.0/bin/omni-skills'),
        CHANNEL_HOMEBREW
      );
    });

    it('detects Winget on Windows', () => {
      assert.strictEqual(
        classifyBinaryPath('C:\\Users\\Dev\\AppData\\Local\\Microsoft\\WindowsApps\\omni-skills.exe'),
        CHANNEL_WINGET
      );
    });

    it('detects Winget program files install', () => {
      assert.strictEqual(
        classifyBinaryPath('C:\\Program Files\\omni-skills\\omni-skills.exe'),
        CHANNEL_WINGET
      );
    });

    it('treats other native binaries as direct download', () => {
      assert.strictEqual(
        classifyBinaryPath('/usr/local/bin/omni-skills'),
        CHANNEL_DIRECT_BINARY
      );
      assert.strictEqual(
        classifyBinaryPath('C:\\tools\\omni-skills.exe'),
        CHANNEL_DIRECT_BINARY
      );
    });
  });

  describe('detectInstallChannel', () => {
    it('detects npm when running under Node from the package', () => {
      const channel = detectInstallChannel({
        execPath: '/opt/homebrew/bin/node',
        argv0: '/opt/homebrew/bin/node',
        argv1: '/Users/mm/.npm-global/lib/node_modules/ai-omni-skills/cli.js',
      });
      assert.strictEqual(channel, CHANNEL_NPM);
    });

    it('detects npm when running under Bun from the package', () => {
      const channel = detectInstallChannel({
        execPath: '/opt/homebrew/bin/bun',
        argv0: '/opt/homebrew/bin/bun',
        argv1: '/Users/mm/.npm-global/lib/node_modules/ai-omni-skills/cli.js',
      });
      assert.strictEqual(channel, CHANNEL_NPM);
    });

    it('detects Homebrew native binary by resolved Cellar path', () => {
      const channel = detectInstallChannel({
        execPath: '/opt/homebrew/Cellar/omni-skills/1.5.0/bin/omni-skills',
        argv0: '/opt/homebrew/Cellar/omni-skills/1.5.0/bin/omni-skills',
        argv1: '',
      });
      assert.strictEqual(channel, CHANNEL_HOMEBREW);
    });

    it('detects direct binary when path is not a known package manager', () => {
      const channel = detectInstallChannel({
        execPath: '/usr/local/bin/omni-skills',
        argv0: '/usr/local/bin/omni-skills',
        argv1: '',
      });
      assert.strictEqual(channel, CHANNEL_DIRECT_BINARY);
    });
  });

  describe('getUpdateInstruction', () => {
    it('returns npm command for npm channel', () => {
      assert.strictEqual(
        getUpdateInstruction(CHANNEL_NPM),
        'npm install -g ai-omni-skills@latest'
      );
    });

    it('returns brew command for Homebrew channel', () => {
      assert.strictEqual(getUpdateInstruction(CHANNEL_HOMEBREW), 'brew upgrade omni-skills');
    });

    it('returns winget command for Winget channel', () => {
      assert.strictEqual(getUpdateInstruction(CHANNEL_WINGET), 'winget upgrade omni-skills');
    });

    it('returns download URL for direct binary', () => {
      assert.match(
        getUpdateInstruction(CHANNEL_DIRECT_BINARY),
        /github.com\/moatazhamada\/ai-omni-skills\/releases/
      );
    });
  });

  describe('getInstallChannelLabel', () => {
    it('returns human labels', () => {
      assert.strictEqual(getInstallChannelLabel(CHANNEL_NPM), 'npm package');
      assert.strictEqual(getInstallChannelLabel(CHANNEL_HOMEBREW), 'Homebrew formula');
      assert.strictEqual(getInstallChannelLabel(CHANNEL_WINGET), 'Winget package');
      assert.strictEqual(getInstallChannelLabel(CHANNEL_DIRECT_BINARY), 'native binary');
    });
  });
});
