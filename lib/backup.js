import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { absPath, parentDir } from './fs-utils.js';
import { configPath } from './config.js';

const BACKUP_DIR = join(homedir(), '.config', 'skills', 'backups');

function uniqueFiles(files) {
  const seen = new Set();
  const out = [];
  for (const f of files) {
    if (!f || seen.has(f)) continue;
    seen.add(f);
    out.push(f);
  }
  return out;
}

function collectFilesToBackup(config) {
  const files = [];

  const cfg = configPath();
  if (cfg) files.push(cfg);

  for (const tool of Object.values(config.tools ?? {})) {
    if (tool.instructionFile) files.push(absPath(tool.instructionFile));
    if (tool.mcp?.file) files.push(absPath(tool.mcp.file));
    if (tool.hooks?.file) files.push(absPath(tool.hooks.file));
  }

  return uniqueFiles(files);
}

export function createPreSyncBackup(config) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(BACKUP_DIR, timestamp);
  const files = collectFilesToBackup(config).filter((f) => existsSync(f));

  if (files.length === 0) {
    return null;
  }

  parentDir(backupDir);
  mkdirSync(backupDir, { recursive: true });

  for (const file of files) {
    const dest = join(backupDir, file.replace(homedir(), '~'));
    parentDir(dest);
    const stat = statSync(file);
    cpSync(file, dest, { recursive: stat.isDirectory() });
  }

  pruneBackups(30);
  return backupDir;
}

export function listBackups() {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(BACKUP_DIR, e.name))
    .sort((a, b) => b.localeCompare(a));
}

export function pruneBackups(maxAgeDays = 30) {
  if (!existsSync(BACKUP_DIR)) return [];
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const removed = [];

  for (const entry of readdirSync(BACKUP_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(BACKUP_DIR, entry.name);
    const stat = statSync(dir);
    if (stat.mtimeMs < cutoff) {
      rmSync(dir, { recursive: true, force: true });
      removed.push(dir);
    }
  }

  return removed;
}
