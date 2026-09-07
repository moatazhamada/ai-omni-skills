import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { syncTools } from '../lib/sync.js';

describe('sync.js', () => {
  describe('project-local skills directories', () => {
    let tmpRoot;
    let projectDir;
    let skillsDir;
    let originalCwd;

    before(() => {
      originalCwd = process.cwd();
      tmpRoot = join(tmpdir(), `omni-skills-sync-test-${Date.now()}`);
      projectDir = join(tmpRoot, 'project');
      skillsDir = join(tmpRoot, 'skills');

      mkdirSync(projectDir, { recursive: true });
      mkdirSync(join(projectDir, '.git'), { recursive: true });
      mkdirSync(join(skillsDir, 'android-development'), { recursive: true });
      writeFileSync(
        join(skillsDir, 'android-development', 'SKILL.md'),
        '---\nname: android-development\ndescription: Android dev skill\n---\n\n# Android Development\n\nTest content.\n'
      );
      writeFileSync(join(skillsDir, 'SHARED.md'), 'Shared instructions\n');

      process.chdir(projectDir);
    });

    after(() => {
      process.chdir(originalCwd);
      rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('syncs skills to project-local directory when projectSkillsDirs is configured', async () => {
      const config = {
        skillPaths: [skillsDir],
        sharedFile: join(skillsDir, 'SHARED.md'),
        projectSkillsDirs: {
          codex: '.agents/skills',
        },
        tools: {
          codex: {
            instructionFile: null,
            instructionMode: null,
            skillsDir: null,
            mcp: null,
            hooks: null,
          },
        },
      };

      await syncTools(config, 'codex', { dryRun: false, noBackup: true });

      const skillPath = join(
        projectDir,
        '.agents',
        'skills',
        'android-development',
        'SKILL.md'
      );
      assert.strictEqual(existsSync(skillPath), true);
      assert.match(readFileSync(skillPath, 'utf8'), /Android Development/);
      assert.strictEqual(
        existsSync(join(projectDir, '.agents', 'skills', 'android-development', '.omni-skills-managed')),
        true
      );
    });

    it('skips project-local sync when not inside a project', async () => {
      process.chdir(tmpRoot);

      const config = {
        skillPaths: [skillsDir],
        sharedFile: join(skillsDir, 'SHARED.md'),
        projectSkillsDirs: {
          codex: '.agents/skills',
        },
        tools: {
          codex: {
            instructionFile: null,
            instructionMode: null,
            skillsDir: null,
            mcp: null,
            hooks: null,
          },
        },
      };

      await syncTools(config, 'codex', { dryRun: false, noBackup: true });

      assert.strictEqual(existsSync(join(tmpRoot, '.agents', 'skills')), false);
    });
  });
});
