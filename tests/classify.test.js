import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scanInstructionText, isInstructionFile } from '../lib/classify.js';

describe('classify module', () => {
  describe('scanInstructionText', () => {
    it('returns empty array for clean text with no sensitive content', () => {
      const hits = scanInstructionText('This is just a normal text file.');
      assert.strictEqual(hits.length, 0);
    });

    it('returns non-empty array for text with API key', () => {
      const hits = scanInstructionText('Here is my key: sk-abc123def456ghi for use');
      assert.strictEqual(hits.length, 1);
    });

    it('returns non-empty array for text with JIRA ticket', () => {
      const hits = scanInstructionText('Fixes PROJ-123 in the backlog');
      assert.strictEqual(hits.length, 1);
    });

    it('returns non-empty array for text with internal domain', () => {
      const hits = scanInstructionText('Call the server at api.corp.local for data');
      assert.ok(hits.length >= 1);
    });

    it('returns non-empty array for text with confidentiality marker', () => {
      const hits = scanInstructionText('This is confidential information');
      assert.ok(hits.length >= 1);
    });

    it('returns non-empty array for text with env secret', () => {
      const hits = scanInstructionText('My config SECRET_KEY="my-secret"');
      assert.ok(hits.length >= 1);
    });

    it('returns array with length > 1 for multiple hits', () => {
      const hits = scanInstructionText('Fixes PROJ-123. Key: sk-abc123def456ghi');
      assert.ok(hits.length > 1);
    });
  });

  describe('isInstructionFile', () => {
    it('returns true for AGENTS.md', () => {
      assert.strictEqual(isInstructionFile('AGENTS.md'), true);
    });

    it('returns true for CLAUDE.md', () => {
      assert.strictEqual(isInstructionFile('CLAUDE.md'), true);
    });

    it('returns true for .cursorrules', () => {
      assert.strictEqual(isInstructionFile('.cursorrules'), true);
    });

    it('returns true for agents.md (case insensitive)', () => {
      assert.strictEqual(isInstructionFile('agents.md'), true);
    });

    it('returns false for README.md', () => {
      assert.strictEqual(isInstructionFile('README.md'), false);
    });

    it('returns false for package.json', () => {
      assert.strictEqual(isInstructionFile('package.json'), false);
    });

    it('returns false for random-file.txt', () => {
      assert.strictEqual(isInstructionFile('random-file.txt'), false);
    });
  });
});
