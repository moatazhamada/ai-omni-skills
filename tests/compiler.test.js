import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  parseSkillMarkdown,
  compileSkillForTool,
  getCompilerForTool,
  MarkdownCompiler,
  CodexCompiler,
  GeminiCompiler,
  SupportedTool,
  isSupportedTool,
  SkillScope,
  isSkillScope,
  inferSkillScopeFromPath,
  skillConfigFromUnknown,
  Capability,
  isCapability,
  SafetyConstraintKey,
  SafetyConstraintValue,
  SkillConfigError,
  FrontmatterParseError,
  YamlParseError,
  ValidationError,
} from '../lib/compiler/index.js';

describe('Compiler Pipeline', () => {
  describe('1. parseSkillMarkdown', () => {
    it('should parse valid YAML frontmatter', () => {
      const md = '---\nskillName: test-skill\nversion: "1.0.0"\ndescription: A test\n---\n\n# Body content';
      const result = parseSkillMarkdown(md);
      assert.strictEqual(result.config.skillName, 'test-skill');
      assert.strictEqual(result.hasFrontmatter, true);
      assert.ok(result.body.includes('# Body content'));
    });

    it('should fallback to zero-config when missing frontmatter', () => {
      const md = '# Just body content';
      const result = parseSkillMarkdown(md);
      assert.strictEqual(result.hasFrontmatter, false);
      assert.strictEqual(result.config.skillName, 'unknown-skill');
      assert.strictEqual(result.config.version, '0.0.0');
    });

    it('should parse legacy unquoted version without error', () => {
      const md = '---\nskillName: test\nversion: 1.0\n---\n\nbody';
      const result = parseSkillMarkdown(md);
      assert.strictEqual(typeof result.config.version, 'string');
    });

    it('should throw FrontmatterParseError for missing closing delimiter', () => {
      const md = '---\nskillName: test\nversion: "1.0"\nbody';
      assert.throws(() => parseSkillMarkdown(md), FrontmatterParseError);
    });

    it('should throw YamlParseError for empty YAML block', () => {
      const md = '---\n---\nbody';
      assert.throws(() => parseSkillMarkdown(md), YamlParseError);
    });

    it('should infer skill name from path', () => {
      const result = parseSkillMarkdown('# body', { filePath: '/skills/my-cool-skill/SKILL.md' });
      assert.strictEqual(result.config.skillName, 'my-cool-skill');
    });

    it('should map legacy name key to skillName', () => {
      const md = '---\nname: legacy-skill\nversion: "1.0.0"\n---\nbody';
      const result = parseSkillMarkdown(md);
      assert.strictEqual(result.config.skillName, 'legacy-skill');
    });
  });

  describe('2. skillConfigFromUnknown', () => {
    it('should return a valid config with default scope GENERAL for valid minimal config', () => {
      const unknown = { skillName: 'x', version: '1.0', description: 'desc' };
      const config = skillConfigFromUnknown(unknown);
      assert.strictEqual(config.skillName, 'x');
      assert.strictEqual(config.scope, SkillScope.GENERAL);
    });

    it('should throw ValidationError if skillName is missing', () => {
      const unknown = { version: '1.0' };
      assert.throws(() => skillConfigFromUnknown(unknown), ValidationError);
    });

    it('should throw ValidationError on capability/safety conflict', () => {
      const unknown = {
        skillName: 'x',
        version: '1.0',
        description: 'desc',
        executionBoundary: {
          requiredCapabilities: ['file_system_write'],
          safetyConstraints: { fileSystemWrite: 'disabled' },
        },
      };
      assert.throws(() => skillConfigFromUnknown(unknown), ValidationError);
    });

    it('should throw ValidationError when tool override disables required capability', () => {
      const unknown = {
        skillName: 'x',
        version: '1.0',
        description: 'desc',
        executionBoundary: {
          requiredCapabilities: ['file_system_write'],
        },
        toolOverrides: {
          claude: {
            disabledCapabilities: ['file_system_write'],
          },
        },
      };
      assert.throws(() => skillConfigFromUnknown(unknown), ValidationError);
    });
  });

  describe('3. SupportedTool and isSupportedTool', () => {
    it('should support claude', () => {
      assert.strictEqual(isSupportedTool('claude'), true);
    });

    it('should support gemini', () => {
      assert.strictEqual(isSupportedTool('gemini'), true);
    });

    it('should not support unknown-tool', () => {
      assert.strictEqual(isSupportedTool('unknown-tool'), false);
    });

    it('should not support a number', () => {
      assert.strictEqual(isSupportedTool(42), false);
    });
  });

  describe('4. Compiler Factory', () => {
    it('should not throw for CLAUDE', () => {
      assert.doesNotThrow(() => getCompilerForTool(SupportedTool.CLAUDE));
    });

    it('should not throw for CODEX', () => {
      assert.doesNotThrow(() => getCompilerForTool(SupportedTool.CODEX));
    });

    it('should not throw for GEMINI', () => {
      assert.doesNotThrow(() => getCompilerForTool(SupportedTool.GEMINI));
    });

    it('should throw for nonexistent tool', () => {
      assert.throws(() => getCompilerForTool('nonexistent'), {
        message: /No compiler registered/
      });
    });
  });

  describe('5. MarkdownCompiler output', () => {
    it('should compile for default target tool', () => {
      const config = skillConfigFromUnknown({ skillName: 'test', version: '1.0.0', description: 'Test skill' });
      const result = compileSkillForTool(config, '# Test body', SupportedTool.CLAUDE);
      
      assert.strictEqual(result.targetTool, 'claude');
      assert.ok(result.markdownContent.includes('Auto-generated by Omni Skills'));
      assert.ok(result.markdownContent.includes('test'));
      assert.ok(result.markdownContent.includes('# Test body'));
    });
  });

  describe('6. CodexCompiler output', () => {
    it('should include YAML frontmatter and body for CODEX', () => {
      const config = skillConfigFromUnknown({ skillName: 'test', version: '1.0.0', description: 'Test skill' });
      const result = compileSkillForTool(config, '# Test body', SupportedTool.CODEX);
      
      assert.strictEqual(result.targetTool, 'codex');
      assert.ok(result.markdownContent.includes('---\nname:'));
      assert.ok(result.markdownContent.includes('description:'));
      assert.ok(result.markdownContent.includes('# Test body'));
    });
  });

  describe('7. GeminiCompiler output', () => {
    it('should include structuredMetadata for GEMINI', () => {
      const config = skillConfigFromUnknown({ skillName: 'test', version: '1.0.0', description: 'Test skill' });
      const result = compileSkillForTool(config, '# Test body', SupportedTool.GEMINI);
      
      assert.strictEqual(result.targetTool, 'gemini');
      assert.ok(result.structuredMetadata);
      assert.ok(result.structuredMetadata.json);
      assert.ok(result.structuredMetadata.json.omniSkills);
      assert.strictEqual(result.structuredMetadata.json.omniSkills.skillName, 'test');
    });
  });

  describe('8. SkillScope inference', () => {
    it('should infer scope from path', () => {
      const scope = inferSkillScopeFromPath('/home/user/public-skills/test/SKILL.md');
      assert.ok(isSkillScope(scope));
    });

    it('should validate correct scopes', () => {
      assert.strictEqual(isSkillScope('general'), true);
      assert.strictEqual(isSkillScope('project-specific'), true);
    });

    it('should reject invalid scopes', () => {
      assert.strictEqual(isSkillScope('invalid'), false);
    });
  });

  describe('9. Error hierarchy', () => {
    it('ValidationError should inherit from SkillConfigError', () => {
      assert.ok(new ValidationError('test') instanceof SkillConfigError);
    });

    it('FrontmatterParseError should inherit from SkillConfigError', () => {
      assert.ok(new FrontmatterParseError('test') instanceof SkillConfigError);
    });

    it('YamlParseError should inherit from FrontmatterParseError', () => {
      assert.ok(new YamlParseError('test') instanceof FrontmatterParseError);
    });
  });
});
