import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, chmodSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findOmniSkillsInstallations,
  getActiveInstallation,
} from '../lib/install-detector.js';
import { CHANNEL_DIRECT_BINARY, CHANNEL_NPM } from '../lib/install-channel.js';

function makeFakeBinary(dir, version, name = 'omni-skills') {
  const path = join(dir, name);
  writeFileSync(
    path,
    `#!/bin/sh\necho "v${version}"\n`,
    { mode: 0o755 }
  );
  chmodSync(path, 0o755);
  return path;
}

describe('install-detector.js', () => {
  it('finds a single omni-skills installation', () => {
    const tmp = join(tmpdir(), `omni-detect-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
    makeFakeBinary(tmp, '1.5.1');

    const installations = findOmniSkillsInstallations(tmp);
    assert.strictEqual(installations.length, 1);
    assert.strictEqual(installations[0].version, '1.5.1');
    assert.strictEqual(installations[0].channel, CHANNEL_DIRECT_BINARY);

    rmSync(tmp, { recursive: true, force: true });
  });

  it('returns the first directory on PATH as active', () => {
    const tmpA = join(tmpdir(), `omni-detect-a-${Date.now()}`);
    const tmpB = join(tmpdir(), `omni-detect-b-${Date.now()}`);
    mkdirSync(tmpA, { recursive: true });
    mkdirSync(tmpB, { recursive: true });
    makeFakeBinary(tmpA, '1.5.1');
    makeFakeBinary(tmpB, '1.4.0');

    const pathEnv = `${tmpA}:${tmpB}`;
    const installations = findOmniSkillsInstallations(pathEnv);
    assert.strictEqual(installations.length, 2);
    assert.strictEqual(installations[0].version, '1.5.1');
    assert.strictEqual(installations[1].version, '1.4.0');

    const active = getActiveInstallation(installations);
    assert.strictEqual(active.version, '1.5.1');

    rmSync(tmpA, { recursive: true, force: true });
    rmSync(tmpB, { recursive: true, force: true });
  });

  it('deduplicates by real path', () => {
    const tmp = join(tmpdir(), `omni-detect-dup-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
    const realDir = join(tmp, 'real');
    const linkDir = join(tmp, 'link');
    mkdirSync(realDir, { recursive: true });
    mkdirSync(linkDir, { recursive: true });
    makeFakeBinary(realDir, '1.5.1');

    // Create a symlink to the same binary in another PATH-style dir.
    symlinkSync(join(realDir, 'omni-skills'), join(linkDir, 'omni-skills'));

    const pathEnv = `${realDir}:${linkDir}`;
    const installations = findOmniSkillsInstallations(pathEnv);
    assert.strictEqual(installations.length, 1);
    assert.strictEqual(installations[0].version, '1.5.1');

    rmSync(tmp, { recursive: true, force: true });
  });

  it('detects npm global installation by path', () => {
    const tmp = join(tmpdir(), `omni-detect-npm-${Date.now()}`);
    const npmGlobal = join(tmp, 'lib', 'node_modules', 'ai-omni-skills');
    mkdirSync(npmGlobal, { recursive: true });
    makeFakeBinary(npmGlobal, '1.5.1');

    const binDir = join(tmp, 'bin');
    mkdirSync(binDir, { recursive: true });
    symlinkSync(join(npmGlobal, 'omni-skills'), join(binDir, 'omni-skills'));

    const installations = findOmniSkillsInstallations(binDir);
    assert.strictEqual(installations.length, 1);
    assert.strictEqual(installations[0].channel, CHANNEL_NPM);

    rmSync(tmp, { recursive: true, force: true });
  });

  it('returns empty array when PATH is empty', () => {
    const installations = findOmniSkillsInstallations('');
    assert.deepStrictEqual(installations, []);
  });
});
