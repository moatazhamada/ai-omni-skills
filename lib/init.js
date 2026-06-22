import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, symlinkSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import readline from 'node:readline';
import { expandTilde } from './config.js';
import { scanSkills } from './skills.js';
import { scanSkillText } from './sensitive.js';
import { syncTools } from './sync.js';
import { buildIndex } from './index-gen.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded);
}

function resolveDestPaths(config) {
  let publicPath = absPath(config.publicPath);
  let privatePath = absPath(config.privatePath);

  if (!publicPath && config.skillPaths) {
    const paths = config.skillPaths.map(absPath).filter(Boolean);
    if (paths.length >= 2) {
      publicPath = paths[0];
      privatePath = privatePath || paths[1];
    }
  }
  if (!privatePath && config.skillPaths) {
    const paths = config.skillPaths.map(absPath).filter(Boolean);
    if (paths.length >= 1) {
      privatePath = paths[paths.length - 1];
    }
  }

  return { publicPath, privatePath };
}

function scanDir(root, seen) {
  const out = [];
  const absRoot = absPath(root);
  if (!existsSync(absRoot)) return out;
  let entries;
  try {
    entries = readdirSync(absRoot, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const dir = join(absRoot, entry.name);
    if (seen.has(dir)) continue;
    seen.add(dir);
    const file = join(dir, 'SKILL.md');
    if (!existsSync(file)) continue;
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const description = text.split('\n').slice(0, 10).find((l) => l.trim() && !l.startsWith('#'))?.trim() || '';
    out.push({ name: entry.name, dir, file, description });
  }
  return out;
}

function prompt(rl, text) {
  return new Promise((resolve) => rl.question(text, resolve));
}

export async function initSkills(config, { dryRun = false } = {}) {
  const skills = scanSkills(config);
  const knownNames = new Set(skills.map((s) => s.name));
  const { publicPath, privatePath } = resolveDestPaths(config);

  if (!publicPath && !privatePath) {
    console.error('Error: Could not determine publicPath or privatePath from config.');
    console.error('Please add "publicPath" and "privatePath" to your config.json,');
    console.error('or ensure "skillPaths" has at least one entry.');
    process.exit(1);
  }

  const seenDirs = new Set();
  const candidates = [];

  for (const tool of Object.values(config.tools ?? {})) {
    if (tool.skillsDir) {
      candidates.push(...scanDir(tool.skillsDir, seenDirs));
    }
  }
  candidates.push(...scanDir('~/.agents/skills', seenDirs));
  candidates.push(...scanDir('~/.claude/skills', seenDirs));

  const actionable = candidates
    .map((c) => {
      const text = readFileSync(c.file, 'utf8');
      const hits = scanSkillText(text);
      const recommendation = hits.length > 0 ? 'private' : 'public';
      return { ...c, hits, recommendation };
    })
    .filter((c) => !knownNames.has(c.name));

  if (actionable.length === 0) {
    console.log('No new candidate skills found.');
    await syncTools(config, 'all', { dryRun });
    if (!dryRun) {
      await buildIndex(config);
    } else {
      console.log('(dry-run: skipping index write)');
    }
    return;
  }

  const isTty = process.stdin.isTTY && process.stdout.isTTY;
  const interactive = !dryRun && isTty;

  let rl;
  if (interactive) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  for (const c of actionable) {
    console.log(`\n--- ${c.name} ---`);
    console.log(`description: ${c.description || '(none)'}`);
    console.log(`source: ${c.dir}`);
    console.log(`recommendation: ${c.recommendation}`);
    if (c.hits.length) {
      console.log('sensitive hits:');
      for (const h of c.hits) console.log(`  - ${h}`);
    }

    let decision = c.recommendation;
    if (interactive) {
      const answer = await prompt(rl, `[p]ublic / [v] private / [s]kip (default: ${c.recommendation}): `);
      const a = answer.trim().toLowerCase();
      if (a === 'p') decision = 'public';
      else if (a === 'v') decision = 'private';
      else if (a === 's') decision = 'skip';
      else if (a) decision = 'skip';
    } else {
      console.log(`(non-interactive / dry-run: using recommendation ${decision})`);
    }

    if (decision === 'skip') continue;

    const destRoot = decision === 'public' ? publicPath : privatePath;
    if (!destRoot) {
      console.log(`  skip: ${decision}Path not configured in config`);
      continue;
    }
    const destDir = join(destRoot, c.name);

    if (existsSync(destDir)) {
      console.log(`  skip: destination already exists ${destDir}`);
      continue;
    }

    if (dryRun) {
      console.log(`  would move ${c.dir} -> ${destDir} and replace source with symlink`);
      continue;
    }

    mkdirSync(destRoot, { recursive: true });
    renameSync(c.dir, destDir);
    symlinkSync(destDir, c.dir);
    console.log(`  moved to ${destDir} and symlinked back`);
  }

  if (rl) rl.close();

  await syncTools(config, 'all', { dryRun });
  if (!dryRun) {
    await buildIndex(config);
  } else {
    console.log('\n(dry-run: skipping index write)');
  }
}
