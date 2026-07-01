import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findExistingSkillsDirectories, offerImportOrFresh } from '../lib/setup.js';

describe('setup.js', () => {
  describe('findExistingSkillsDirectories', () => {
    const originalHome = process.env.HOME;
    let tmpHome;

    beforeEach(() => {
      tmpHome = join(tmpdir(), `skills-setup-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      process.env.HOME = tmpHome;
    });

    afterEach(() => {
      process.env.HOME = originalHome;
      rmSync(tmpHome, { recursive: true, force: true });
    });

    it('finds directories with SHARED.md and ranks them above skill-only dirs', () => {
      const toolkit = join(tmpHome, 'Main', 'Projects', 'Skills');
      const privateSkills = join(tmpHome, 'Main', 'Projects', 'Skills-private');
      const other = join(tmpHome, 'Projects', 'other-skills');

      mkdirSync(privateSkills, { recursive: true });
      writeFileSync(join(privateSkills, 'SHARED.md'), '# shared');

      mkdirSync(join(other, 'my-skill'), { recursive: true });
      writeFileSync(
        join(other, 'my-skill', 'SKILL.md'),
        '---\nname: my-skill\n---\n\nSkill instructions.\n'
      );

      const candidates = findExistingSkillsDirectories(toolkit);

      assert.ok(candidates.length >= 2);
      assert.strictEqual(candidates[0].path, privateSkills);
      assert.ok(candidates.some((c) => c.path === other));
    });

    it('skips the toolkit directory itself', () => {
      const toolkit = join(tmpHome, 'Main', 'Projects', 'Skills');
      mkdirSync(toolkit, { recursive: true });
      writeFileSync(join(toolkit, 'SHARED.md'), '# toolkit');

      const candidates = findExistingSkillsDirectories(toolkit);

      assert.ok(!candidates.some((c) => c.path === toolkit));
    });

    it('detects a skills directory by name when no SHARED.md or SKILL.md files exist', () => {
      const toolkit = join(tmpHome, 'Main', 'Projects', 'Skills');
      const namedOnly = join(tmpHome, 'Projects', 'my-ai-skills');
      mkdirSync(namedOnly, { recursive: true });

      const candidates = findExistingSkillsDirectories(toolkit);

      assert.ok(candidates.some((c) => c.path === namedOnly));
    });
  });

  describe('offerImportOrFresh', () => {
    const originalHome = process.env.HOME;
    const originalCi = process.env.CI;
    let tmpHome;

    beforeEach(() => {
      tmpHome = join(tmpdir(), `skills-offer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      process.env.HOME = tmpHome;
      process.env.CI = '1';
    });

    afterEach(() => {
      process.env.HOME = originalHome;
      if (originalCi === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = originalCi;
      }
      rmSync(tmpHome, { recursive: true, force: true });
    });

    it('returns cli flags when --yes is set without prompting', async () => {
      const result = await offerImportOrFresh({ privatePath: '/tmp/my-private', yes: true });

      assert.strictEqual(result.skillsPath, '/tmp/my-private');
      assert.strictEqual(result.source, 'cli');
      assert.strictEqual(result.imported, false);
    });

    it('falls back to defaults when no flags are provided', async () => {
      const result = await offerImportOrFresh({ yes: true });

      assert.strictEqual(result.skillsPath, '~/my-skills');
      assert.strictEqual(result.toolkitDir, '~/Main/Projects/Skills');
      assert.strictEqual(result.source, 'default');
    });
  });
});
