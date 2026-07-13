import { describe, it } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  compileSkillForTool,
  parseSkillMarkdown,
  SupportedTool,
} from '../lib/compiler/index.js';
import { migrateLegacyCodexSkillsDir } from '../lib/config.js';
import { DEFAULT_CONFIG } from '../lib/default-config.js';
import { syncTools } from '../lib/sync.js';

describe('Codex compatibility', () => {
  it('emits a discoverable SKILL.md with required frontmatter', () => {
    const parsed = parseSkillMarkdown(`---
name: review-helper
description: Review changes safely and explain the findings.
version: 1.2.3
---

# Review helper

Inspect the diff before editing.
`);

    const output = compileSkillForTool(
      parsed.config,
      parsed.body,
      SupportedTool.CODEX
    );

    assert.match(
      output.markdownContent,
      /^---\nname: "review-helper"\ndescription: "Review changes safely and explain the findings\."\n---\n/
    );
    assert.match(output.markdownContent, /# Execution Boundary/);
    assert.match(output.markdownContent, /# Review helper/);
    assert.strictEqual(output.structuredMetadata, undefined);
  });

  it('uses the current user-level Codex skills directory', () => {
    assert.strictEqual(
      DEFAULT_CONFIG.tools.codex.skillsDir,
      '~/.agents/skills'
    );
  });

  it('migrates the legacy Codex skills directory in existing configs', () => {
    const config = {
      tools: { codex: { skillsDir: '~/.codex/skills' } },
    };

    migrateLegacyCodexSkillsDir(config);

    assert.strictEqual(config.tools.codex.skillsDir, '~/.agents/skills');
  });

  it('writes escaped Codex MCP and hook TOML', async () => {
    const tmp = join(tmpdir(), `omni-codex-${process.pid}-${Date.now()}`);
    const codexConfig = join(tmp, 'config.toml');
    mkdirSync(tmp, { recursive: true });

    const config = {
      sharedFile: null,
      skillPaths: [],
      mcpServerName: 'skills server',
      mcpCommand: '/path/with "quote"/node',
      mcpArgs: ['script with spaces.js', 'mcp'],
      hooks: [
        {
          event: 'SessionStart',
          matcher: 'startup|resume',
          command: "echo 'ready'",
        },
      ],
      tools: {
        codex: {
          instructionFile: null,
          skillsDir: null,
          mcp: { file: codexConfig, format: 'codex-toml' },
          hooks: { file: codexConfig, format: 'codex-toml' },
        },
      },
    };

    try {
      await syncTools(config, 'codex', { dryRun: false, noBackup: true });
      assert.ok(existsSync(codexConfig));
      const content = readFileSync(codexConfig, 'utf8');

      assert.match(content, /\[mcp_servers\."skills server"\]/);
      assert.match(content, /command = "\/path\/with \\"quote\\"\/node"/);
      assert.match(content, /args = \["script with spaces\.js", "mcp"\]/);
      assert.match(content, /command = "echo 'ready'"/);
      assert.doesNotMatch(content, /command = 'echo 'ready''/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('preserves an existing unmanaged Codex skill on name collision', async () => {
    const tmp = join(tmpdir(), `omni-codex-collision-${process.pid}-${Date.now()}`);
    const sourceRoot = join(tmp, 'source');
    const sourceSkill = join(sourceRoot, 'shared-name');
    const skillsDir = join(tmp, 'installed');
    const existingSkill = join(skillsDir, 'shared-name');
    mkdirSync(sourceSkill, { recursive: true });
    mkdirSync(existingSkill, { recursive: true });
    writeFileSync(
      join(sourceSkill, 'SKILL.md'),
      '---\nname: shared-name\ndescription: Canonical version\n---\n\nCanonical body\n'
    );
    writeFileSync(
      join(existingSkill, 'SKILL.md'),
      '---\nname: shared-name\ndescription: Existing version\n---\n\nKeep me\n'
    );

    const config = {
      sharedFile: null,
      skillPaths: [sourceRoot],
      hooks: [],
      tools: {
        codex: {
          instructionFile: null,
          skillsDir,
          mcp: null,
          hooks: null,
        },
      },
    };

    try {
      await syncTools(config, 'codex', { dryRun: false, noBackup: true });
      const content = readFileSync(join(existingSkill, 'SKILL.md'), 'utf8');
      assert.match(content, /description: Existing version/);
      assert.match(content, /Keep me/);
      assert.strictEqual(
        existsSync(join(existingSkill, '.omni-skills-managed')),
        false
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('keeps Codex skill resource directories attached to compiled skills', async () => {
    const tmp = join(tmpdir(), `omni-codex-resources-${process.pid}-${Date.now()}`);
    const sourceRoot = join(tmp, 'source');
    const sourceSkill = join(sourceRoot, 'resourceful');
    const sourceScripts = join(sourceSkill, 'scripts');
    const skillsDir = join(tmp, 'installed');
    mkdirSync(sourceScripts, { recursive: true });
    writeFileSync(
      join(sourceSkill, 'SKILL.md'),
      '---\nname: resourceful\ndescription: Uses bundled scripts\n---\n\nRun the helper.\n'
    );
    writeFileSync(join(sourceScripts, 'helper.js'), 'export default true;\n');

    const config = {
      sharedFile: null,
      skillPaths: [sourceRoot],
      hooks: [],
      tools: {
        codex: {
          instructionFile: null,
          skillsDir,
          mcp: null,
          hooks: null,
        },
      },
    };

    try {
      await syncTools(config, 'codex', { dryRun: false, noBackup: true });
      const installedSkill = join(skillsDir, 'resourceful');
      assert.ok(existsSync(join(installedSkill, '.omni-skills-managed')));
      assert.ok(existsSync(join(installedSkill, 'scripts', 'helper.js')));
      assert.match(
        readFileSync(join(installedSkill, 'SKILL.md'), 'utf8'),
        /^---\nname: "resourceful"\ndescription: "Uses bundled scripts"\n---/
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('cleans obsolete managed Codex skills but preserves unmanaged legacy content', async () => {
    const tmp = join(tmpdir(), `omni-codex-legacy-${process.pid}-${Date.now()}`);
    const sourceRoot = join(tmp, 'source');
    const currentSkillsDir = join(tmp, 'current');
    const legacySkillsDir = join(tmp, 'legacy');
    const managedLegacySkill = join(legacySkillsDir, 'managed-old-skill');
    const unmanagedLegacySkill = join(legacySkillsDir, 'keep-this-skill');
    mkdirSync(sourceRoot, { recursive: true });
    mkdirSync(managedLegacySkill, { recursive: true });
    mkdirSync(unmanagedLegacySkill, { recursive: true });
    writeFileSync(
      join(managedLegacySkill, 'SKILL.md'),
      '<!-- Auto-generated by Omni Skills for codex -->\nOld compiled output\n'
    );
    writeFileSync(
      join(unmanagedLegacySkill, 'SKILL.md'),
      '---\nname: keep-this-skill\ndescription: User managed\n---\n\nKeep me\n'
    );

    const config = {
      sharedFile: null,
      skillPaths: [sourceRoot],
      hooks: [],
      tools: {
        codex: {
          instructionFile: null,
          skillsDir: currentSkillsDir,
          legacySkillsDir,
          mcp: null,
          hooks: null,
        },
      },
    };

    try {
      await syncTools(config, 'codex', { dryRun: false, noBackup: true });
      assert.strictEqual(existsSync(managedLegacySkill), false);
      assert.strictEqual(existsSync(unmanagedLegacySkill), true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
