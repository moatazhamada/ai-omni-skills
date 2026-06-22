import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { scanSkills } from './skills.js';
import { aggregate } from './usage.js';

const START_MARKER = '<!-- SKILLS:START -->';
const END_MARKER = '<!-- SKILLS:END -->';

function sortSkills(skills, usageMap) {
  return [...skills].sort((a, b) => {
    const ua = usageMap[a.name]?.count ?? 0;
    const ub = usageMap[b.name]?.count ?? 0;
    if (ua !== ub) return ub - ua;
    return a.name.localeCompare(b.name);
  });
}

function buildIndexMarkdown(title, intro, skills) {
  const lines = [`# ${title}`, '', intro, ''];
  if (skills.length === 0) {
    lines.push('_No skills found._', '');
  } else {
    lines.push('| Skill | Description |', '| ----- | ----------- |');
    for (const s of skills) {
      const desc = s.description.replace(/\s+/g, ' ').trim();
      lines.push(`| ${s.name} | ${desc} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function updateSharedBlock(filePath, skills) {
  const lines = [
    START_MARKER,
    '## Shared skills',
    '',
    'Call list_skills / read_skill (skills MCP server) to load any before acting.',
    '',
  ];

  if (skills.length === 0) {
    lines.push('_No skills found._', '');
  } else {
    for (const s of skills) {
      lines.push(`- **${s.name}** — ${s.description}`);
    }
    lines.push('');
  }
  lines.push(END_MARKER);

  const generated = lines.join('\n');

  let content;
  if (existsSync(filePath)) {
    content = readFileSync(filePath, 'utf8');
  } else {
    content = '';
  }

  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);

  let newContent;
  if (start !== -1 && end !== -1 && end > start) {
    newContent = content.slice(0, start) + generated + content.slice(end + END_MARKER.length);
  } else {
    if (content && !content.endsWith('\n')) content += '\n';
    newContent = content + generated + '\n';
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, newContent, 'utf8');
}

export async function buildIndex(config) {
  const skills = scanSkills(config);
  const usageMap = aggregate(config);
  const ordered = sortSkills(skills, usageMap);

  const written = [];

  for (const targetDir of config.indexTargets ?? []) {
    const targetSkills = ordered.filter((s) => s.dir.startsWith(targetDir));
    mkdirSync(targetDir, { recursive: true });
    const indexPath = `${targetDir}/INDEX.md`;
    writeFileSync(
      indexPath,
      buildIndexMarkdown(
        'Skills index',
        'This index lists skills in this repo, ordered by recent usage.',
        targetSkills
      ),
      'utf8'
    );
    written.push(indexPath);
  }

  if (config.sharedFile) {
    updateSharedBlock(config.sharedFile, ordered);
    written.push(config.sharedFile);
  }

  console.log(`Indexed ${skills.length} skill(s).`);
  console.log(`Wrote: ${written.join(', ')}`);
}
