import {
  appendFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, isAbsolute, join, resolve, sep, basename } from 'node:path';
import { homedir } from 'node:os';
import { expandTilde } from './config.js';

function isWithin(parent, child) {
  if (!parent) return false;
  const resolvedParent = resolve(parent);
  const resolvedChild = resolve(child);
  if (resolvedChild === resolvedParent) return true;
  return resolvedChild.startsWith(resolvedParent + sep);
}

function isAllowedTempPath(p) {
  const resolved = resolve(p);
  const tmpRoots = ['/tmp', '/var/folders'];
  for (const root of tmpRoots) {
    if (resolved === root || resolved.startsWith(root + sep)) return true;
  }
  return false;
}

export function absPath(inputPath) {
  if (inputPath == null) {
    return null;
  }
  const expandedPath = expandTilde(inputPath);
  const finalPath = resolve(isAbsolute(expandedPath) ? expandedPath : join(process.cwd(), expandedPath));

  const home = homedir();
  const cwd = process.cwd();

  if (!isWithin(home, finalPath) && !isWithin(cwd, finalPath) && !isAllowedTempPath(finalPath)) {
    throw new Error(`SecurityError: Path access blocked. Path ${finalPath} is outside allowed boundaries (home, cwd, or safe temp directories).`);
  }

  return finalPath;
}

const TRASH_DIR = join(homedir(), '.omni-skills-trash');
const TRASH_MANIFEST = join(TRASH_DIR, '.manifest.jsonl');

function ensureTrashDir() {
  if (!existsSync(TRASH_DIR)) {
    mkdirSync(TRASH_DIR, { recursive: true });
  }
}

function readTrashManifest() {
  if (!existsSync(TRASH_MANIFEST)) return [];
  return readFileSync(TRASH_MANIFEST, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function moveToTrash(p) {
  const finalPath = absPath(p);
  if (!existsSync(finalPath)) return;

  ensureTrashDir();

  const bname = basename(finalPath);
  const timestamp = Date.now();
  const dest = join(TRASH_DIR, `${bname}.${timestamp}.bak`);

  try {
    renameSync(finalPath, dest);
  } catch (err) {
    if (err.code === 'EXDEV') {
      cpSync(finalPath, dest, { recursive: true });
      rmSync(finalPath, { recursive: true, force: true });
    } else {
      throw err;
    }
  }

  const entry = { timestamp, originalPath: finalPath, trashedName: basename(dest) };
  appendFileSync(TRASH_MANIFEST, JSON.stringify(entry) + '\n');
}

export function listTrash() {
  ensureTrashDir();
  const manifest = readTrashManifest();
  const known = new Set(manifest.map((m) => m.trashedName));

  // Surface legacy items that have no manifest entry.
  const legacy = readdirSync(TRASH_DIR)
    .filter((name) => name !== basename(TRASH_MANIFEST) && !known.has(name))
    .map((name) => ({ timestamp: 0, originalPath: null, trashedName: name, legacy: true }));

  return manifest.map((m, index) => ({ ...m, index })).concat(
    legacy.map((m, i) => ({ ...m, index: manifest.length + i }))
  );
}

export function restoreTrashItem(index) {
  const items = listTrash();
  const item = items[index];
  if (!item) {
    throw new Error(`Trash item at index ${index} not found`);
  }
  if (item.legacy || !item.originalPath) {
    throw new Error(`Cannot restore legacy item: original path is unknown`);
  }

  const trashedPath = join(TRASH_DIR, item.trashedName);
  if (!existsSync(trashedPath)) {
    throw new Error(`Trashed file no longer exists: ${trashedPath}`);
  }
  if (existsSync(item.originalPath)) {
    throw new Error(`Restore target already exists: ${item.originalPath}`);
  }

  parentDir(item.originalPath);
  renameSync(trashedPath, item.originalPath);

  // Remove from manifest.
  const manifest = readTrashManifest().filter((m) => m.trashedName !== item.trashedName);
  writeFileSync(TRASH_MANIFEST, manifest.map((m) => JSON.stringify(m)).join('\n') + (manifest.length ? '\n' : ''));

  return item.originalPath;
}

export function pruneTrash(maxAgeDays = 30) {
  ensureTrashDir();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const manifest = readTrashManifest();
  const kept = [];
  const removed = [];

  for (const entry of manifest) {
    const trashedPath = join(TRASH_DIR, entry.trashedName);
    if (entry.timestamp < cutoff) {
      if (existsSync(trashedPath)) {
        rmSync(trashedPath, { recursive: true, force: true });
      }
      removed.push(entry);
    } else {
      kept.push(entry);
    }
  }

  writeFileSync(TRASH_MANIFEST, kept.map((m) => JSON.stringify(m)).join('\n') + (kept.length ? '\n' : ''));
  return removed;
}

export function emptyTrash() {
  ensureTrashDir();
  const manifest = readTrashManifest();
  for (const entry of manifest) {
    const trashedPath = join(TRASH_DIR, entry.trashedName);
    if (existsSync(trashedPath)) {
      rmSync(trashedPath, { recursive: true, force: true });
    }
  }
  writeFileSync(TRASH_MANIFEST, '');
  return manifest;
}

export function parentDir(p) {
  const dir = dirname(p);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

export function ensureSymlink(linkPath, target, { dryRun, backupPath } = {}) {
  const absLink = absPath(linkPath);
  const absTarget = absPath(target);
  const createdParent = parentDir(absLink);
  const backupFor = (p) => {
    const b = backupPath ? absPath(backupPath) : `${p}.pre-skills.bak`;
    if (!dryRun) parentDir(b);
    return b;
  };

  if (!existsSync(absLink)) {
    if (dryRun) {
      return `would create symlink ${absLink} -> ${absTarget}`;
    }
    symlinkSync(absTarget, absLink);
    return `${createdParent ? 'created parent and ' : ''}created symlink ${absLink} -> ${absTarget}`;
  }

  const stat = lstatSync(absLink);
  if (stat.isSymbolicLink()) {
    let currentTarget;
    try {
      currentTarget = readlinkSync(absLink);
    } catch {
      currentTarget = null;
    }
    const same =
      currentTarget === absTarget ||
      (existsSync(absLink) && existsSync(absTarget) && realpathSync(absLink) === realpathSync(absTarget));
    if (same) {
      return `symlink already correct ${absLink} -> ${absTarget}`;
    }
    const backup = backupFor(absLink);
    if (!existsSync(backup)) {
      if (dryRun) {
        return `would backup existing symlink ${absLink} to ${backup}, then link -> ${absTarget}`;
      }
      renameSync(absLink, backup);
    } else {
      if (dryRun) {
        return `would remove existing symlink ${absLink} (backup ${backup} exists), then link -> ${absTarget}`;
      }
      moveToTrash(absLink);
    }
    symlinkSync(absTarget, absLink);
    return `replaced existing symlink ${absLink} -> ${absTarget} (backup at ${backup})`;
  }

  // Real file or directory in the way.
  const backup = backupFor(absLink);
  if (!existsSync(backup)) {
    if (dryRun) {
      return `would backup existing ${stat.isDirectory() ? 'dir' : 'file'} ${absLink} to ${backup}, then link -> ${absTarget}`;
    }
    renameSync(absLink, backup);
  } else {
    if (dryRun) {
      return `would replace existing ${stat.isDirectory() ? 'dir' : 'file'} ${absLink} (backup ${backup} exists) with symlink -> ${absTarget}`;
    }
    moveToTrash(absLink);
  }
  symlinkSync(absTarget, absLink);
  return `backed up existing ${stat.isDirectory() ? 'dir' : 'file'} ${absLink} -> ${backup} and linked -> ${absTarget}`;
}

export function upsertManagedBlock(filePath, startMarker, endMarker, blockText, { dryRun } = {}) {
  const absFile = absPath(filePath);
  let content = '';
  if (existsSync(absFile)) {
    try {
      content = readFileSync(absFile, 'utf8');
    } catch {
      content = '';
    }
  }

  const wrapped = `${startMarker}\n${blockText}${blockText.endsWith('\n') ? '' : '\n'}${endMarker}\n`;
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  let newContent;
  if (start !== -1 && end !== -1 && end > start) {
    newContent = content.slice(0, start) + wrapped + content.slice(end + endMarker.length);
  } else {
    if (content && !content.endsWith('\n')) content += '\n';
    newContent = content + wrapped;
  }

  if (newContent === content) {
    return `managed block already up-to-date in ${absFile}`;
  }

  if (dryRun) {
    return `would update managed block in ${absFile}`;
  }

  parentDir(absFile);
  writeFileSync(absFile, newContent, 'utf8');
  return `updated managed block in ${absFile}`;
}

export function readJson(file) {
  const absFile = absPath(file);
  if (!existsSync(absFile)) return {};
  const text = readFileSync(absFile, 'utf8');
  const ext = extname(absFile).toLowerCase();
  let cleaned = text;
  if (ext === '.jsonc') {
    cleaned = text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
  }
  return JSON.parse(cleaned);
}

export function writeJson(file, obj, { dryRun } = {}) {
  const absFile = absPath(file);
  if (dryRun) {
    return `would write ${absFile}`;
  }
  parentDir(absFile);
  if (extname(absFile).toLowerCase() === '.jsonc') {
    console.warn(`warning: ${absFile} is .jsonc; comments will be dropped on write`);
  }
  writeFileSync(absFile, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  return `wrote ${absFile}`;
}
