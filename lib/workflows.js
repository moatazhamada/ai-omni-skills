import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { expandTilde } from './config.js';
import matter from 'gray-matter';

function absPath(p) {
  if (p == null) return null;
  const expanded = expandTilde(p);
  return expanded.startsWith('/') ? expanded : join(process.cwd(), expanded);
}

export function scanWorkflows(config) {
  const paths = (config.workflowPaths || [])
    .map(absPath)
    .filter((p) => p && existsSync(p));

  const workflows = [];
  const seen = new Set();

  for (const p of paths) {
    let entries = [];
    try {
      entries = readdirSync(p, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const entryPath = join(p, entry.name);
      if (entry.isDirectory()) {
        const wfPath = join(entryPath, 'WORKFLOW.md');
        if (existsSync(wfPath)) {
          const wf = readWorkflow(wfPath);
          if (wf && !seen.has(wf.name)) {
            seen.add(wf.name);
            workflows.push(wf);
          }
        }
      } else if (entry.name === 'WORKFLOW.md') {
        const wf = readWorkflow(entryPath);
        if (wf && !seen.has(wf.name)) {
          seen.add(wf.name);
          workflows.push(wf);
        }
      }
    }
  }
  return workflows.sort((a, b) => a.name.localeCompare(b.name));
}

function readWorkflow(path) {
  try {
    const text = readFileSync(path, 'utf-8');
    const parsed = matter(text);
    const name = parsed.data.name || dirname(path).split('/').pop();
    return {
      name,
      description: parsed.data.description || '',
      goal: parsed.data.goal || '',
      steps: parsed.data.steps || [],
      path,
    };
  } catch {
    return null;
  }
}

export function formatWorkflowList(workflows) {
  const lines = ['', 'Available workflows:', ''];
  for (const wf of workflows) {
    const stepCount = countSteps(wf.steps);
    lines.push(`  ${wf.name.padEnd(24)} ${stepCount} step(s)  ${wf.description}`);
    if (wf.goal) {
      lines.push(`    Goal: ${wf.goal}`);
    }
    const summary = summarizeSteps(wf.steps);
    if (summary) {
      lines.push(`    ${summary}`);
    }
  }
  if (workflows.length === 0) {
    lines.push('  No workflows found.');
    lines.push('');
    lines.push('  Create workflows in your skills repo under a workflows/ directory.');
    lines.push('  Each workflow is a directory with a WORKFLOW.md file.');
  }
  lines.push('');
  return lines.join('\n');
}

export function countSteps(steps) {
  if (!Array.isArray(steps)) return 0;
  let count = 0;
  for (const step of steps) {
    if (typeof step === 'string') {
      count++;
    } else if (step.skill) {
      count++;
    } else if (step.loop) {
      count += 1 + countSteps(step.loop.steps || []);
    } else if (step.condition) {
      count += 1 + countSteps(step.condition.then || []);
      count += countSteps(step.condition.else || []);
    } else if (step.parallel) {
      const branches = step.parallel.branches || step.parallel;
      for (const branch of branches) {
        count += countSteps(branch.steps || []);
      }
    } else {
      count++;
    }
  }
  return count;
}

function summarizeSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return '';
  const parts = [];
  for (const step of steps) {
    if (typeof step === 'string') {
      parts.push(step);
    } else if (step.skill) {
      parts.push(step.skill);
    } else if (step.loop) {
      parts.push(`[loop ${step.loop.until || 'until done'}]`);
    } else if (step.condition) {
      parts.push(`[if ${step.condition.check}]`);
    } else if (step.parallel) {
      parts.push(`[parallel ${step.parallel.length} branches]`);
    }
  }
  return parts.join(' → ');
}

export function getWorkflow(config, name) {
  const all = scanWorkflows(config);
  return all.find((w) => w.name === name) || null;
}

export function validateWorkflowSteps(workflow, availableSkills) {
  const skillNames = new Set(availableSkills.map((s) => s.name));
  const missing = [];
  _collectMissing(workflow.steps || [], skillNames, missing);
  return missing;
}

function _collectMissing(steps, skillNames, missing) {
  for (const step of steps) {
    if (typeof step === 'string') {
      if (!skillNames.has(step)) missing.push(step);
    } else if (step.skill) {
      if (!skillNames.has(step.skill)) missing.push(step.skill);
    } else if (step.loop) {
      _collectMissing(step.loop.steps || [], skillNames, missing);
    } else if (step.condition) {
      _collectMissing(step.condition.then || [], skillNames, missing);
      _collectMissing(step.condition.else || [], skillNames, missing);
    } else if (step.parallel) {
      const branches = step.parallel.branches || step.parallel;
      for (const branch of branches) {
        _collectMissing(branch.steps || [], skillNames, missing);
      }
    }
  }
}

export function generateWorkflowPrompt(workflow, availableSkills) {
  const lines = [
    `# Workflow: ${workflow.name}`,
    '',
  ];

  if (workflow.description) {
    lines.push(workflow.description);
    lines.push('');
  }

  if (workflow.goal) {
    lines.push(`**Goal:** ${workflow.goal}`);
    lines.push('');
  }

  lines.push('## Execution Plan');
  lines.push('');
  lines.push('Run this workflow step by step. For each step, load the skill, execute it, and check if the goal is met before moving on.');
  lines.push('');

  const skillMap = new Map(availableSkills.map((s) => [s.name, s]));
  _renderSteps(lines, workflow.steps || [], skillMap, 1);

  lines.push('---');
  lines.push('');
  lines.push('## Execution Rules');
  lines.push('');
  lines.push('- **Load before acting:** Read the full SKILL.md for each step before executing it.');
  lines.push('- **Check goals:** After each step, verify the goal is met. If not, retry or loop.');
  lines.push('- **Loops:** Repeat the loop body until the `until` condition is true or `max_iterations` is reached.');
  lines.push('- **Conditions:** Evaluate the `check`. If true, run `then`. If false, run `else` (or skip).');
  lines.push('- **Parallel:** Run all branches concurrently. Wait for all to complete before proceeding.');
  lines.push('- **Retries:** If a step fails, retry up to `max_retries` before failing the workflow.');
  lines.push('');

  return lines.join('\n');
}

function _renderSteps(lines, steps, skillMap, depth = 1) {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const indent = '  '.repeat(depth - 1);

    if (typeof step === 'string') {
      const skill = skillMap.get(step);
      lines.push(`${indent}${i + 1}. **${step}**`);
      if (skill?.description) {
        lines.push(`${indent}   ${skill.description}`);
      }
      lines.push('');
    } else if (step.skill) {
      const skill = skillMap.get(step.skill);
      lines.push(`${indent}${i + 1}. **${step.skill}**`);
      if (skill?.description) {
        lines.push(`${indent}   ${skill.description}`);
      }
      if (step.goal) {
        lines.push(`${indent}   🎯 Goal: "${step.goal}"`);
      }
      if (step.prompt) {
        lines.push(`${indent}   💬 Prompt: "${step.prompt}"`);
      }
      if (step.max_retries) {
        lines.push(`${indent}   🔁 Retry: up to ${step.max_retries} times`);
      }
      lines.push('');
    } else if (step.loop) {
      lines.push(`${indent}${i + 1}. **Loop** 🔁`);
      if (step.loop.goal) {
        lines.push(`${indent}   🎯 Goal: "${step.loop.goal}"`);
      }
      if (step.loop.until) {
        lines.push(`${indent}   ⏹️ Until: "${step.loop.until}"`);
      }
      if (step.loop.max_iterations) {
        lines.push(`${indent}   🔢 Max iterations: ${step.loop.max_iterations}`);
      }
      lines.push(`${indent}   Body:`);
      _renderSteps(lines, step.loop.steps || [], skillMap, depth + 1);
      lines.push('');
    } else if (step.condition) {
      lines.push(`${indent}${i + 1}. **Condition** ❓`);
      if (step.condition.goal) {
        lines.push(`${indent}   🎯 Goal: "${step.condition.goal}"`);
      }
      lines.push(`${indent}   Check: "${step.condition.check}"`);
      lines.push(`${indent}   ✅ Then:`);
      _renderSteps(lines, step.condition.then || [], skillMap, depth + 1);
      if (step.condition.else && step.condition.else.length > 0) {
        lines.push(`${indent}   ❌ Else:`);
        _renderSteps(lines, step.condition.else, skillMap, depth + 1);
      }
      lines.push('');
    } else if (step.parallel) {
      lines.push(`${indent}${i + 1}. **Parallel** ⚡`);
      if (step.parallel.goal) {
        lines.push(`${indent}   🎯 Goal: "${step.parallel.goal}"`);
      }
      for (let j = 0; j < step.parallel.length; j++) {
        const branch = step.parallel[j];
        lines.push(`${indent}   Branch ${j + 1}:`);
        _renderSteps(lines, branch.steps || [], skillMap, depth + 1);
      }
      lines.push('');
    }
  }
}
