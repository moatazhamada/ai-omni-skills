---
name: advanced-feature-dev
description: Full feature development with loops, conditions, and parallel validation
goal: "Feature is specified, implemented, tested, and committed with all quality gates passing"
steps:
  - skill: refine-requests
    goal: "Requirements are clear, have acceptance criteria, and are unambiguous"
    prompt: "Ask me clarifying questions until the feature is fully defined"
    max_retries: 2

  - loop:
      goal: "Specification is complete and I approve it"
      until: "user says approved"
      max_iterations: 3
      steps:
        - skill: speckit-specify
          goal: "spec.md exists with all requirements covered"
        - skill: speckit-checklist
          goal: "Checklist validates that spec is complete and testable"

  - condition:
      goal: "We have a solid plan before coding"
      check: "spec is complex (more than 5 requirements)"
      then:
        - skill: speckit-plan
          goal: "plan.md has actionable tasks with clear dependencies"
      else:
        - skill: speckit-tasks
          goal: "tasks.md has the minimal set of tasks needed"

  - skill: speckit-implement
    goal: "All tasks are implemented and the feature works"

  - parallel:
      goal: "All quality checks pass simultaneously"
      branches:
        - steps:
            - skill: lint-and-validate
              goal: "Code passes all linting and type checks"
        - steps:
            - skill: testing-patterns
              goal: "All tests pass and new code has coverage"
        - steps:
            - skill: speckit-analyze
              goal: "Spec, plan, and implementation are consistent"

  - skill: speckit-git-commit
    goal: "All changes are committed with a descriptive message"
---

# Advanced Feature Development Workflow

A full feature development workflow that uses loops, conditions, and parallel steps.

## Trigger

When you have a complex feature and want structured development with quality gates.

## Usage

```bash
skills workflow run advanced-feature-dev
```

## Step Breakdown

1. **refine-requests** (with retry) — Ask clarifying questions until the feature is clear
2. **Loop: specify → checklist** — Repeat until spec is approved (max 3 iterations)
3. **Condition: plan vs tasks** — If complex, full plan; if simple, minimal tasks
4. **speckit-implement** — Build it
5. **Parallel: lint + test + analyze** — All quality checks at once
6. **speckit-git-commit** — Commit everything

## Key Concepts

- **Loop:** Keeps refining until you say "approved" — no premature commitment
- **Condition:** Adapts to complexity — simple features don't need full planning
- **Parallel:** Quality checks run together, not sequentially — faster feedback
- **Goals:** Every step has a clear "done" condition
- **Retries:** If a step fails, it retries up to the limit before giving up

## Variations

For a quick fix, skip the loop and condition:

```yaml
steps:
  - skill: refine-requests
  - skill: speckit-implement
  - skill: testing-patterns
  - skill: speckit-git-commit
```

For a large refactor, add more parallel checks:

```yaml
- parallel:
    branches:
      - steps:
          - skill: lint-and-validate
      - steps:
          - skill: testing-patterns
      - steps:
          - skill: systematic-debugging
      - steps:
          - skill: speckit-analyze
```
