import { describe, it } from 'node:test';
import assert from 'node:assert';
import { executeWithConsent } from '../lib/prompt.js';

describe('prompt.js', () => {
  describe('executeWithConsent', () => {
    it('runs in dry-run mode without prompting when --dry-run is passed', async () => {
      const calls = [];
      const actionFn = async (flags) => {
        calls.push(flags);
        return 'dry-run-result';
      };

      const result = await executeWithConsent(actionFn, { dryRun: true, yes: false });

      assert.strictEqual(result, 'dry-run-result');
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].dryRun, true);
    });

    it('runs for real without prompting when --yes is passed', async () => {
      const calls = [];
      const actionFn = async (flags) => {
        calls.push(flags);
        return 'yes-result';
      };

      const result = await executeWithConsent(actionFn, { dryRun: false, yes: true });

      assert.strictEqual(result, 'yes-result');
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].dryRun, false);
    });

    it('gives --dry-run precedence over --yes', async () => {
      const calls = [];
      const actionFn = async (flags) => {
        calls.push(flags);
        return 'dry-run-wins';
      };

      const result = await executeWithConsent(actionFn, { dryRun: true, yes: true });

      assert.strictEqual(result, 'dry-run-wins');
      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].dryRun, true);
    });
  });
});
