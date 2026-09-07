import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveDestPaths, checkSymlink } from '../lib/doctor.js';

describe('doctor module', () => {
  describe('resolveDestPaths', () => {
    it('returns skillsPath for both public and private if provided', () => {
      const config = { skillsPath: '/test/skills' };
      const result = resolveDestPaths(config);
      assert.strictEqual(result.publicPath, '/test/skills');
      assert.strictEqual(result.privatePath, '/test/skills');
    });

    it('returns separate publicPath and privatePath', () => {
      const config = { publicPath: '/test/public', privatePath: '/test/private' };
      const result = resolveDestPaths(config);
      assert.strictEqual(result.publicPath, '/test/public');
      assert.strictEqual(result.privatePath, '/test/private');
    });

    it('returns first as public, second as private from skillPaths array', () => {
      const config = { skillPaths: ['/test/public', '/test/private', '/test/other'] };
      const result = resolveDestPaths(config);
      assert.strictEqual(result.publicPath, '/test/public');
      assert.strictEqual(result.privatePath, '/test/private');
    });

    it('returns single entry as privatePath from skillPaths array', () => {
      const config = { skillPaths: ['/test/private'] };
      const result = resolveDestPaths(config);
      assert.strictEqual(result.publicPath, null);
      assert.strictEqual(result.privatePath, '/test/private');
    });

    it('returns both null for empty config', () => {
      const config = {};
      const result = resolveDestPaths(config);
      assert.strictEqual(result.publicPath, null);
      assert.strictEqual(result.privatePath, null);
    });
  });

  describe('checkSymlink', () => {
    const tmp = join(tmpdir(), 'doctor-test-' + Math.random().toString(36).slice(2));

    before(() => {
      mkdirSync(tmp, { recursive: true });
      writeFileSync(join(tmp, 'target.txt'), 'hello');
      symlinkSync(join(tmp, 'target.txt'), join(tmp, 'valid-link'));
      symlinkSync(join(tmp, 'missing.txt'), join(tmp, 'broken-link'));
      writeFileSync(join(tmp, 'regular-file.txt'), 'hello');
    });

    after(() => {
      rmSync(tmp, { recursive: true, force: true });
    });

    it('returns empty array for valid symlink', () => {
      const issues = checkSymlink(join(tmp, 'valid-link'), 'Test Label');
      assert.strictEqual(issues.length, 0);
    });

    it('returns issue with MISSING for broken symlink (dangling target)', () => {
      const issues = checkSymlink(join(tmp, 'broken-link'), 'Test Label');
      assert.strictEqual(issues.length, 1);
      assert.match(issues[0], /MISSING/);
    });

    it('returns issue with NOT A SYMLINK for regular file', () => {
      const issues = checkSymlink(join(tmp, 'regular-file.txt'), 'Test Label');
      assert.strictEqual(issues.length, 1);
      assert.match(issues[0], /NOT A SYMLINK/);
    });

    it('returns issue with MISSING for nonexistent path', () => {
      const issues = checkSymlink(join(tmp, 'does-not-exist'), 'Test Label');
      assert.strictEqual(issues.length, 1);
      assert.match(issues[0], /MISSING/);
    });
  });
});
