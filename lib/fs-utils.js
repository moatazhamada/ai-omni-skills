import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, isAbsolute, join } from 'node:path';
import { expandTilde } from './config.js';

export function absPath(inputPath) {
  if (inputPath == null) {
    return null;
  }
  const expandedPath = expandTilde(inputPath);
  if (isAbsolute(expandedPath)) {
    return expandedPath;
  }
  return join(process.cwd(), expandedPath);
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
      rmSync(absLink);
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
    rmSync(absLink, { recursive: true, force: true });
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
