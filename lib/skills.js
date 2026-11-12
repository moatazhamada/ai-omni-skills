import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, isAbsolute } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';

function resolveDir(p) {
  if (isAbsolute(p)) return p;
  return join(process.cwd(), p);
}

export function scanSkills(config) {
  const seen = new Map();
  const results = [];

  for (const rawPath of config.skillPaths ?? []) {
    const root = resolveDir(rawPath);
    if (!existsSync(root)) continue;
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const dir = join(root, entry.name);
      const file = join(dir, 'SKILL.md');
      if (!existsSync(file)) continue;

      let body = '';
      try {
        body = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      const parsed = parseFrontmatter(body);
      const name = parsed.data?.name || entry.name;
      const description = parsed.data?.description || '';
      const isPublic = rawPath === config.skillsPath || rawPath === config.publicPath;

      if (seen.has(name)) {
        console.warn(`Duplicate skill name "${name}" in ${dir} (first seen in ${seen.get(name)}); skipping.`);
        continue;
      }
      seen.set(name, dir);

      results.push({
        name,
        description,
        dir,
        file,
        repo: basename(root),
        isPublic,
      });
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

export function readSkillBody(skill) {
  return readFileSync(skill.file, 'utf8');
}
