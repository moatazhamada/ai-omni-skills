import yaml from 'js-yaml';

// Matches a leading YAML front-matter block delimited by '---' fences.
// The inner group is optional so an empty block ('---\n---\n') still matches.
const FRONTMATTER = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

// Last-resort scan for malformed YAML (e.g. an unquoted colon in a description).
function flatFallback(source) {
  const data = {};
  for (const line of source.split('\n')) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    data[key] = line.slice(idx + 1).trim();
  }
  return data;
}

export function parseFrontmatter(text) {
  if (typeof text !== 'string') return { data: {}, content: '' };

  const match = FRONTMATTER.exec(text);
  if (!match) return { data: {}, content: text };

  let data = {};
  try {
    const parsed = yaml.load(match[1] ?? '');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed;
    }
  } catch {
    data = flatFallback(match[1] ?? '');
  }

  return { data, content: text.slice(match[0].length) };
}
