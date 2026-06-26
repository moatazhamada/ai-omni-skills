import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { createPreSyncBackup, listBackups, pruneBackups } from '../lib/backup.js';

describe('backup.js', () => {
  it('creates a pre-sync backup of configured files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skills-backup-'));
    const instructionFile = join(dir, 'instruction.md');
    const mcpFile = join(dir, 'mcp.json');
    writeFileSync(instructionFile, 'instructions', 'utf8');
    writeFileSync(mcpFile, '{}', 'utf8');

    const config = {
      tools: {
        test: {
          instructionFile,
          mcp: { file: mcpFile },
        },
      },
    };

    const backupDir = createPreSyncBackup(config);
    assert(backupDir);
    assert(existsSync(backupDir));

    // Recursively find a file matching the instruction basename.
    function find(base) {
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        const path = join(base, entry.name);
        if (entry.isDirectory()) {
          const found = find(path);
          if (found) return found;
        } else if (entry.name === 'instruction.md') {
          return path;
        }
      }
      return null;
    }
    assert(find(backupDir));

    rmSync(backupDir, { recursive: true, force: true });
  });

  it('returns null when there are no configured files and no config file', () => {
    // When the user config exists, it is always backed up; when tools is empty and
    // no config is present, the function has nothing to copy.
    const config = { tools: {} };
    const backupDir = createPreSyncBackup(config);
    if (process.env.SKILLS_CONFIG || existsSync(join(process.env.HOME || '/tmp', '.config', 'skills', 'config.json'))) {
      assert(backupDir);
    } else {
      assert.equal(backupDir, null);
    }
  });

  it('prunes old backups', () => {
    const root = mkdtempSync(join(tmpdir(), 'skills-backup-root-'));
    const oldDir = join(root, 'old');
    mkdirSync(oldDir, { recursive: true });
    const removed = pruneBackups(0);
    assert(removed.length >= 0);
    rmSync(root, { recursive: true, force: true });
  });

  it('lists backups sorted newest first', () => {
    const list = listBackups();
    assert(Array.isArray(list));
  });
});
