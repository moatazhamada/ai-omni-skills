import { describe, it } from 'node:test';
import assert from 'node:assert';
import { absPath, moveToTrash, listTrash, restoreTrashItem, parentDir, ensureSymlink, upsertManagedBlock } from '../lib/fs-utils.js';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

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

    it('allows paths inside the home directory', () => {
      const result = absPath(join(homedir(), 'safe-file'));
      assert.ok(result.startsWith(homedir()));
    });

    it('allows paths inside the current working directory', () => {
      const result = absPath('./safe-file');
      assert.ok(result.startsWith(process.cwd()));
    });

    it('allows paths inside temp directories', () => {
      const result = absPath(join(tmpdir(), 'safe-file'));
      assert.ok(result.startsWith(tmpdir()));
    });

    it('blocks paths outside allowed boundaries', () => {
      assert.throws(() => absPath('/etc/passwd'), /SecurityError/);
    });

    it('blocks relative paths that escape outside allowed boundaries', () => {
      assert.throws(() => absPath('../../../../etc/passwd'), /SecurityError/);
    });

    it('rejects prefix-attack paths that start with home but are outside home', () => {
      // A path like /Users/mmalloy (when home is /Users/mm) must not be treated as inside home.
      const fakeHomeSibling = homedir() + 'evil';
      assert.throws(() => absPath(fakeHomeSibling), /SecurityError/);
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

  describe('moveToTrash', () => {
    it('moves a file to the trash directory', () => {
      const id = Date.now();
      const tmpFile = join(tmpdir(), `skills-trash-file-${id}.txt`);
      writeFileSync(tmpFile, 'trash me');
      const trashDir = join(homedir(), '.omni-skills-trash');
      const before = existsSync(trashDir) ? new Set(readdirSync(trashDir)) : new Set();

      moveToTrash(tmpFile);

      assert.ok(!existsSync(tmpFile), 'Original file should be gone');
      assert.ok(existsSync(trashDir), 'Trash dir should exist');
      const after = readdirSync(trashDir).find((name) => !before.has(name) && name.includes(`skills-trash-file-${id}`));
      assert.ok(after, 'Trashed file should exist in trash dir');
      rmSync(join(trashDir, after), { force: true });
    });

    it('moves a directory to the trash directory', () => {
      const id = Date.now();
      const tmpDir = join(tmpdir(), `skills-trash-dir-${id}`);
      mkdirSync(tmpDir, { recursive: true });
      writeFileSync(join(tmpDir, 'child.txt'), 'child');
      const trashDir = join(homedir(), '.omni-skills-trash');
      const before = existsSync(trashDir) ? new Set(readdirSync(trashDir)) : new Set();

      moveToTrash(tmpDir);

      assert.ok(!existsSync(tmpDir), 'Original directory should be gone');
      const after = readdirSync(trashDir).find((name) => !before.has(name) && name.includes(`skills-trash-dir-${id}`));
      assert.ok(after, 'Trashed directory should exist in trash dir');
      rmSync(join(trashDir, after), { recursive: true, force: true });
    });

    it('is a no-op when the path does not exist', () => {
      assert.doesNotThrow(() => moveToTrash(join(tmpdir(), `does-not-exist-${Date.now()}.txt`)));
    });
  });

  describe('listTrash and restoreTrashItem', () => {
    it('lists trashed items and restores by index', () => {
      const id = Date.now();
      const tmpFile = join(tmpdir(), `skills-restore-${id}.txt`);
      writeFileSync(tmpFile, 'restore me');

      moveToTrash(tmpFile);

      const items = listTrash();
      const item = items.find((i) => i.originalPath === tmpFile);
      assert.ok(item, 'Trashed item should appear in listTrash');

      const restored = restoreTrashItem(item.index);
      assert.strictEqual(restored, tmpFile);
      assert.ok(existsSync(tmpFile), 'Restored file should exist at original path');

      rmSync(tmpFile, { force: true });
    });

    it('throws when restoring an unknown index', () => {
      assert.throws(() => restoreTrashItem(99999), /not found/);
    });

    it('throws when restore target already exists', () => {
      const id = Date.now();
      const tmpFile = join(tmpdir(), `skills-restore-collision-${id}.txt`);
      writeFileSync(tmpFile, 'original');

      moveToTrash(tmpFile);
      writeFileSync(tmpFile, 'new file in the way');

      const items = listTrash();
      const item = items.find((i) => i.originalPath === tmpFile);
      assert.ok(item);
      assert.throws(() => restoreTrashItem(item.index), /already exists/);

      // Cleanup.
      rmSync(tmpFile, { force: true });
      const trashed = join(homedir(), '.omni-skills-trash', item.trashedName);
      rmSync(trashed, { force: true });
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
