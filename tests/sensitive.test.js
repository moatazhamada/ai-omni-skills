import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scanSkillText, DENYLIST } from '../lib/sensitive.js';

describe('sensitive.js', () => {
  describe('scanSkillText', () => {
    it('detects generic company names', () => {
      const text = 'This project is for acme-corp and example-project.';
      const hits = scanSkillText(text);
      assert.ok(hits.length > 0, 'Should detect company names');
      assert.ok(hits.some(h => h.includes('acme-corp')), 'Should mention acme-corp');
    });

    it('detects ticket IDs', () => {
      const text = 'Fix the bug reported in TICKET-1234 and ABC-567.';
      const hits = scanSkillText(text);
      assert.ok(hits.length > 0, 'Should detect ticket IDs');
      assert.ok(hits.some(h => h.includes('TICKET-1234')), 'Should mention TICKET-1234');
    });

    it('detects API keys', () => {
      const text = 'sk-abc12345678901234567890';
      const hits = scanSkillText(text);
      assert.ok(hits.length > 0, 'Should detect API key pattern');
    });

    it('detects internal URLs', () => {
      const text = 'The staging server is at https://staging.internal.corp/';
      const hits = scanSkillText(text);
      assert.ok(hits.length > 0, 'Should detect internal URL pattern');
    });

    it('returns empty for generic text', () => {
      const text = 'This is a generic skill about writing clean code and using standard libraries.';
      const hits = scanSkillText(text);
      assert.strictEqual(hits.length, 0, 'Should not flag generic text');
    });
  });

  describe('DENYLIST', () => {
    it('has at least 4 patterns', () => {
      assert.ok(DENYLIST.length >= 4, 'Should have comprehensive denylist');
    });
  });
});
