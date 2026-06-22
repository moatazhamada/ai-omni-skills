import { readFileSync } from 'node:fs';
import { scanSkills } from './skills.js';
import { aggregate } from './usage.js';

function daysAgo(iso) {
  if (!iso) return Infinity;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function lineCount(file) {
  try {
    const text = readFileSync(file, 'utf8');
    return text.split('\n').length;
  } catch {
    return 0;
  }
}

function heuristicSuggestions(skill) {
  const suggestions = [];
  const body = readSkillBodySafe(skill);
  const desc = skill.description || '';

  if (lineCount(skill.file) > 400) {
    suggestions.push('consider splitting');
  }
  if (!/use when/i.test(desc)) {
    suggestions.push('add explicit "Use when…" trigger phrasing');
  }
  if (!/^## /m.test(body)) {
    suggestions.push('add section structure');
  }

  return suggestions;
}

function readSkillBodySafe(skill) {
  try {
    return readFileSync(skill.file, 'utf8');
  } catch {
    return '';
  }
}

export async function reportSkills(config, { enhance = false } = {}) {
  const skills = scanSkills(config);
  const usageMap = aggregate(config);

  const total = Object.values(usageMap).reduce((sum, e) => sum + e.count, 0);
  console.log(`Total invocations: ${total}`);
  console.log(`Skills in index: ${skills.length}\n`);

  const rows = skills
    .map((s) => ({
      name: s.name,
      count: usageMap[s.name]?.count ?? 0,
      lastUsed: usageMap[s.name]?.last ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  console.log('| skill | count | lastUsed |');
  console.log('| ----- | ----- | -------- |');
  for (const r of rows) {
    const last = r.lastUsed ? r.lastUsed.slice(0, 10) : 'never';
    console.log(`| ${r.name} | ${r.count} | ${last} |`);
  }

  const never = skills.filter((s) => !usageMap[s.name]).map((s) => s.name);
  if (never.length) {
    console.log(`\nNever used (${never.length}):`);
    for (const name of never) console.log(`  - ${name}`);
    console.log('\nSuggestion: consider archiving never-used skills to reduce noise.');
  }

  const unused = skills.filter((s) => {
    const u = usageMap[s.name];
    return u && daysAgo(u.last) > 30;
  });
  if (unused.length) {
    console.log(`\nUnused >30 days (${unused.length}):`);
    for (const s of unused) console.log(`  - ${s.name} (last ${usageMap[s.name].last.slice(0, 10)})`);
  }

  if (enhance) {
    console.log('\nHeuristic suggestions:');
    for (const skill of skills) {
      const suggs = heuristicSuggestions(skill);
      if (suggs.length) {
        console.log(`  ${skill.name}: ${suggs.join('; ')}`);
      }
    }
    console.log('\nNote: deeper enhancement would need an agent to read SKILL.md content.');
  }
}
