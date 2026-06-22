import { describe, it } from 'node:test';
import assert from 'node:assert';
import { absPath, parentDir, ensureSymlink, upsertManagedBlock } from '../lib/fs-utils.js';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('fs-utils.js', () => {
  describe('absPath', () => {
    it('expands tilde to home directory', () => {
      const result = absPath('~/test');
      assert.ok(result.includes('test'), 'Should expand tilde');
      assert.ok(!result.startsWith('~'), 'Should not start with tilde');
    });

    it('returns absolute paths unchanged', () => {
      const result = absPath('/tmp/test');
      assert.strictEqual(result, '/tmp/test');
    });
  });

  describe('parentDir', () => {
    it('creates missing directories', () => {
      const tmp = join(tmpdir(), `skills-test-${Date.now()}`);
      const result = parentDir(join(tmp, 'nested', 'file.txt'));
      assert.strictEqual(result, true);
      assert.ok(existsSync(join(tmp, 'nested')));
      rmSync(tmp, { recursive: true, force: true });
    });
  });

  describe('upsertManagedBlock', () => {
    it('inserts a managed block into a new file', () => {
      const tmp = join(tmpdir(), `skills-block-${Date.now()}.txt`);
      const result = upsertManagedBlock(tmp, '<!-- START -->', '<!-- END -->', 'content\n');
      assert.ok(result.includes('updated'));
      const content = readFileSync(tmp, 'utf8');
      assert.ok(content.includes('content'));
      rmSync(tmp, { force: true });
    });

    it('updates an existing managed block', () => {
      const tmp = join(tmpdir(), `skills-block-${Date.now()}.txt`);
      writeFileSync(tmp, 'before\n<!-- START -->\nold\n<!-- END -->\nafter\n');
      const result = upsertManagedBlock(tmp, '<!-- START -->', '<!-- END -->', 'new\n');
      assert.ok(result.includes('updated'));
      const content = readFileSync(tmp, 'utf8');
      assert.ok(content.includes('new'));
      assert.ok(!content.includes('old'));
      rmSync(tmp, { force: true });
    });
  });
});
