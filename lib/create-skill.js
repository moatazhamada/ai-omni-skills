import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import readline from 'node:readline';
import { expandTilde } from './config.js';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded);
}

const SKILL_TEMPLATE = `---
name: {{NAME}}
description: {{DESCRIPTION}}
triggers: {{TRIGGERS}}
---

# {{NAME}}

{{DESCRIPTION}}

## When to Use

- Trigger condition 1
- Trigger condition 2

## Instructions

1. Step one
2. Step two
3. Step three

## Notes

- Add any important notes or edge cases here
- Keep this section updated as you refine the skill
`;

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

export async function createSkill(config, options = {}) {
  const skillsPath = config.skillsPath || (config.skillPaths ? absPath(config.skillPaths[0]) : null);
  if (!skillsPath) {
    console.error('❌ No skillsPath configured. Run `omni-skills setup` first.');
    process.exit(1);
  }

  const isTty = process.stdin.isTTY && process.stdout.isTTY;
  const rl = isTty ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

  // Determine target directory
  let targetDir = options.targetDir || skillsPath;
  if (!existsSync(targetDir)) {
    console.error(`❌ Target directory does not exist: ${targetDir}`);
    console.log('Run `omni-skills setup` to configure your skills directory.');
    process.exit(1);
  }

  let skillName = options.name;
  let description = options.description;
  let triggers = options.triggers;
  let openEditor = options.openEditor ?? true;

  if (isTty && !skillName) {
    skillName = (await ask(rl, 'Skill name (kebab-case, e.g. "refine-requests"): ')).trim();
  }

  if (!skillName) {
    console.error('❌ Skill name is required.');
    process.exit(1);
  }

  // Validate skill name
  const validName = /^[a-z0-9-]+$/.test(skillName);
  if (!validName) {
    console.error('❌ Skill name must be kebab-case (lowercase letters, numbers, hyphens only).');
    process.exit(1);
  }

  const skillDir = join(targetDir, skillName);
  if (existsSync(skillDir)) {
    console.error(`❌ Skill "${skillName}" already exists at ${skillDir}`);
    process.exit(1);
  }

  if (isTty && !description) {
    description = (await ask(rl, 'Description (one sentence, what this skill does): ')).trim();
  }

  if (!description) {
    description = `Use this skill when working with ${skillName}.`;
  }

  if (isTty && !triggers) {
    triggers = (await ask(rl, 'Trigger keywords (comma-separated, e.g. "refine, clarify, review"): ')).trim();
  }

  if (!triggers) {
    triggers = skillName;
  }

  // Create skill directory and file
  mkdirSync(skillDir, { recursive: true });
  const skillFile = join(skillDir, 'SKILL.md');

  const content = SKILL_TEMPLATE
    .replace(/{{NAME}}/g, skillName)
    .replace(/{{DESCRIPTION}}/g, description)
    .replace(/{{TRIGGERS}}/g, triggers);

  writeFileSync(skillFile, content, 'utf8');

  console.log(`✅ Created skill: ${skillName}`);
  console.log(`   Path: ${skillFile}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Edit SKILL.md to add your instructions');
  console.log('  2. Run `omni-skills index` to regenerate the skill index');
  console.log('  3. Run `omni-skills sync all` to wire into all tools');
  console.log('');

  if (isTty && openEditor) {
    const answer = (await ask(rl, 'Open in editor? [y/n] (default: y): ')).trim().toLowerCase();
    if (answer === '' || answer === 'y' || answer === 'yes') {
      const { execSync } = await import('node:child_process');
      const editor = process.env.EDITOR || 'code';
      try {
        execSync(`${editor} "${skillFile}"`, { stdio: 'inherit' });
      } catch {
        console.log(`Could not open editor. Edit manually: ${skillFile}`);
      }
    }
  }

  if (rl) rl.close();
  return { skillName, skillDir, skillFile };
}

export async function createSkillFromFile(config, sourcePath, options = {}) {
  if (!existsSync(sourcePath)) {
    console.error(`❌ Source file does not exist: ${sourcePath}`);
    process.exit(1);
  }

  const skillsPath = config.skillsPath || (config.skillPaths ? absPath(config.skillPaths[0]) : null);
  if (!skillsPath) {
    console.error('❌ No skillsPath configured. Run `omni-skills setup` first.');
    process.exit(1);
  }

  const sourceName = sourcePath.split('/').pop().replace(/\.md$/, '');
  const skillName = options.name || sourceName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const skillDir = join(skillsPath, skillName);
  if (existsSync(skillDir)) {
    console.error(`❌ Skill "${skillName}" already exists.`);
    process.exit(1);
  }

  mkdirSync(skillDir, { recursive: true });
  const skillFile = join(skillDir, 'SKILL.md');

  let content = readFileSync(sourcePath, 'utf8');

  // If content doesn't have frontmatter, add it
  if (!content.trim().startsWith('---')) {
    const description = options.description || `Converted from ${sourceName}`;
    content = `---\nname: ${skillName}\ndescription: ${description}\n---\n\n${content}`;
  }

  writeFileSync(skillFile, content, 'utf8');

  console.log(`✅ Created skill from file: ${skillName}`);
  console.log(`   Source: ${sourcePath}`);
  console.log(`   Path: ${skillFile}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review and edit SKILL.md');
  console.log('  2. Run `omni-skills index` to regenerate the skill index');
  console.log('  3. Run `omni-skills sync all` to wire into all tools');

  return { skillName, skillDir, skillFile };
}
