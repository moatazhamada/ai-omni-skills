import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scanSkills } from '../lib/skills.js';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('skills.js', () => {
  describe('scanSkills', () => {
    it('finds skills with valid frontmatter', () => {
      const tmp = join(tmpdir(), `skills-scan-${Date.now()}`);
      const skillDir = join(tmp, 'test-skill');
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(
        join(skillDir, 'SKILL.md'),
        '---\nname: test-skill\ndescription: A test skill\n---\n\n# Test Skill\n\nInstructions here.\n'
      );

      const config = { skillPaths: [tmp] };
      const skills = scanSkills(config);

      assert.strictEqual(skills.length, 1);
      assert.strictEqual(skills[0].name, 'test-skill');
      assert.strictEqual(skills[0].description, 'A test skill');

      rmSync(tmp, { recursive: true, force: true });
    });

    it('skips directories without SKILL.md', () => {
      const tmp = join(tmpdir(), `skills-scan-${Date.now()}`);
      mkdirSync(join(tmp, 'no-skill'), { recursive: true });
      writeFileSync(join(tmp, 'no-skill', 'README.md'), 'Not a skill');

      const config = { skillPaths: [tmp] };
      const skills = scanSkills(config);

      assert.strictEqual(skills.length, 0);

      rmSync(tmp, { recursive: true, force: true });
    });

    it('skips hidden directories', () => {
      const tmp = join(tmpdir(), `skills-scan-${Date.now()}`);
      const skillDir = join(tmp, '.hidden-skill');
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(
        join(skillDir, 'SKILL.md'),
        '---\nname: hidden\ndescription: Hidden\n---\n\nHidden\n'
      );

      const config = { skillPaths: [tmp] };
      const skills = scanSkills(config);

      assert.strictEqual(skills.length, 0);

      rmSync(tmp, { recursive: true, force: true });
    });
  });
});
