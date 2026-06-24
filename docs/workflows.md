# Workflows

Chain skills together into repeatable sequences. A workflow is a named list of
skills that execute in order — like a playbook for common tasks.

```bash
# List all workflows
omni-skills workflow list

# Run a workflow
omni-skills workflow run release-prep
omni-skills workflow run advanced-feature-dev
```

## Simple Workflow (linear)

```yaml
---
name: release-prep
description: Lint, test, and commit before release
steps:
  - lint-and-validate
  - testing-patterns
  - commit-suggest
---
```

## Advanced Workflow (loops, conditions, parallel)

```yaml
---
name: advanced-feature-dev
description: Full feature development with quality gates
goal: "Feature is specified, implemented, tested, and committed"
steps:
  - skill: refine-requests
    goal: "Requirements are clear and have acceptance criteria"
    max_retries: 2

  - loop:
      goal: "Specification is approved"
      until: "user says approved"
      max_iterations: 3
      steps:
        - skill: speckit-specify
        - skill: speckit-checklist

  - condition:
      check: "spec is complex (more than 5 requirements)"
      then:
        - skill: speckit-plan
      else:
        - skill: speckit-tasks

  - skill: speckit-implement
    goal: "All tasks are implemented"

  - parallel:
      goal: "All quality checks pass"
      branches:
        - steps:
            - skill: lint-and-validate
        - steps:
            - skill: testing-patterns
        - steps:
            - skill: speckit-analyze

  - skill: speckit-git-commit
    goal: "Clean commit with good message"
---
```

## Step types

| Type | Syntax | What it does |
|------|--------|--------------|
| **Skill** | `skill: name` | Load and execute one skill |
| **Goal** | `goal: "..."` | Success condition for this step |
| **Retry** | `max_retries: 3` | Retry if step fails |
| **Loop** | `loop: { until, max_iterations, steps }` | Repeat until condition met |
| **Condition** | `condition: { check, then, else }` | Branch based on a check |
| **Parallel** | `parallel: { branches: [...] }` | Run branches concurrently |

## Features

- **Goals:** Every step has a clear "done" condition.
- **Loops:** Repeat refinement cycles until you approve.
- **Conditions:** Adapt to complexity — simple features skip heavy planning.
- **Parallel:** Quality checks run together, not one-by-one.
- **Retries:** Auto-retry flaky steps before giving up.

Workflows live in your private repo under `workflows/` — they are personal, not
shared.
