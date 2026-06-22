import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, isAbsolute } from 'node:path';
import matter from 'gray-matter';

function resolveDir(p) {
  if (isAbsolute(p)) return p;
  return join(process.cwd(), p);
}

function parseFrontmatter(text) {
  try {
    return matter(text);
  } catch {
    // Fallback for malformed YAML in frontmatter (e.g. unquoted colons).
    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) return { data: {}, content: text };
    const data = {};
    for (const line of match[1].split('\n')) {
      const idx = line.indexOf(':');
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      data[key] = value;
    }
    const contentStart = match[0].length;
    return { data, content: text.slice(contentStart) };
  }
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
