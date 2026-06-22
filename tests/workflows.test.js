import { test } from 'node:test';
import assert from 'node:assert';
import { validateWorkflowSteps, countSteps, generateWorkflowPrompt } from '../lib/workflows.js';

// Mock skills
const skills = [
  { name: 'lint', description: 'Lint code' },
  { name: 'test', description: 'Run tests' },
  { name: 'commit', description: 'Commit changes' },
  { name: 'specify', description: 'Write spec' },
  { name: 'plan', description: 'Plan implementation' },
];

// --- validateWorkflowSteps ---

test('validateWorkflowSteps: linear steps', () => {
  const wf = { steps: ['lint', 'test', 'commit'] };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, []);
});

test('validateWorkflowSteps: missing skill', () => {
  const wf = { steps: ['lint', 'deploy', 'commit'] };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, ['deploy']);
});

test('validateWorkflowSteps: loop with nested skills', () => {
  const wf = {
    steps: [
      'specify',
      {
        loop: {
          until: 'approved',
          steps: ['plan', 'test'],
        },
      },
    ],
  };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, []);
});

test('validateWorkflowSteps: condition with missing skill in else', () => {
  const wf = {
    steps: [
      {
        condition: {
          check: 'complex',
          then: ['plan'],
          else: ['deploy'],
        },
      },
    ],
  };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, ['deploy']);
});

test('validateWorkflowSteps: parallel with missing skill', () => {
  const wf = {
    steps: [
      {
        parallel: {
          branches: [
            { steps: ['lint'] },
            { steps: ['deploy'] },
          ],
        },
      },
    ],
  };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, ['deploy']);
});

test('validateWorkflowSteps: skill objects with goal', () => {
  const wf = {
    steps: [
      { skill: 'lint', goal: 'Code is clean' },
      { skill: 'test', goal: 'Tests pass' },
    ],
  };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, []);
});

// --- countSteps ---

test('countSteps: linear', () => {
  const steps = ['lint', 'test', 'commit'];
  assert.strictEqual(countSteps(steps), 3);
});

test('countSteps: with loop', () => {
  const steps = [
    'lint',
    { loop: { steps: ['test', 'commit'] } },
  ];
  // lint=1, loop=1+2=3 → total 4
  assert.strictEqual(countSteps(steps), 4);
});

test('countSteps: with condition', () => {
  const steps = [
    {
      condition: {
        check: 'x',
        then: ['lint'],
        else: ['test'],
      },
    },
  ];
  assert.strictEqual(countSteps(steps), 3);
});

test('countSteps: with parallel', () => {
  const steps = [
    {
      parallel: {
        branches: [
          { steps: ['lint'] },
          { steps: ['test'] },
        ],
      },
    },
  ];
  assert.strictEqual(countSteps(steps), 2);
});

// --- generateWorkflowPrompt ---

test('generateWorkflowPrompt: renders workflow with all features', () => {
  const wf = {
    name: 'test-wf',
    description: 'Test workflow',
    goal: 'Everything works',
    steps: [
      { skill: 'lint', goal: 'Code is clean', max_retries: 2 },
      {
        loop: {
          goal: 'Spec is good',
          until: 'approved',
          max_iterations: 3,
          steps: ['specify'],
        },
      },
      {
        condition: {
          check: 'complex',
          then: ['plan'],
          else: ['commit'],
        },
      },
      {
        parallel: {
          branches: [
            { steps: ['lint'] },
            { steps: ['test'] },
          ],
        },
      },
    ],
  };
  const prompt = generateWorkflowPrompt(wf, skills);

  assert.ok(prompt.includes('# Workflow: test-wf'));
  assert.ok(prompt.includes('**Goal:** Everything works'));
  assert.ok(prompt.includes('lint'));
  assert.ok(prompt.includes('🎯 Goal: "Code is clean"'));
  assert.ok(prompt.includes('🔁 Retry: up to 2 times'));
  assert.ok(prompt.includes('**Loop** 🔁'));
  assert.ok(prompt.includes('⏹️ Until: "approved"'));
  assert.ok(prompt.includes('🔢 Max iterations: 3'));
  assert.ok(prompt.includes('**Condition** ❓'));
  assert.ok(prompt.includes('**Parallel** ⚡'));
  assert.ok(prompt.includes('Execution Rules'));
});

// --- Edge cases ---

test('validateWorkflowSteps: empty workflow', () => {
  const wf = { steps: [] };
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, []);
});

test('validateWorkflowSteps: null/undefined steps', () => {
  const wf = {};
  const missing = validateWorkflowSteps(wf, skills);
  assert.deepStrictEqual(missing, []);
});

test('countSteps: empty', () => {
  assert.strictEqual(countSteps([]), 0);
  assert.strictEqual(countSteps(null), 0);
  assert.strictEqual(countSteps(undefined), 0);
});
