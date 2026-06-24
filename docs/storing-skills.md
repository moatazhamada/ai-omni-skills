# How to Store Your Skills

This toolkit is **code only**. Your skills live in a separate repository (or two)
that you control.

## Recommended Structure

```
# Your private skills repository (never published)
~/my-skills-private/
  ├── SHARED.md                    ← Generated shared instructions
  ├── INDEX.md                     ← Generated skill index
  ├── config.json                  ← Toolkit configuration
  │
  ├── clean-code/SKILL.md
  ├── systematic-debugging/SKILL.md
  ├── refine-requests/SKILL.md
  ├── codebase-memory/SKILL.md
  ├── mobile-ui-patterns/SKILL.md
  ├── dependency-updates/SKILL.md
  ├── build-optimizer/SKILL.md
  └── ... (all your skills)
  │
  ├── projects/                     ← Per-project instruction files
  │   ├── project-alpha/AGENTS.md
  │   ├── project-beta/AGENTS.md
  │   └── project-gamma/
  │       ├── Core Rules.md
  │       └── Core Rules Compact.md
  │
  ├── workflows/                     ← Chainable skill sequences
  │   ├── release-prep/WORKFLOW.md
  │   ├── feature-dev/WORKFLOW.md
  │   └── debug-trace/WORKFLOW.md
  │
  └── large-projects/
      └── project-gamma/
          └── ensure_symlinks.sh
```

## Why Private?

Your skills are **personal** — they contain:

- Your coding style and preferences
- Your project's internal conventions and architecture
- Your proprietary workflows and domain knowledge
- Your private project structures

No one needs to see your `refine-requests` skill or your `review-feedback`
workflow. The toolkit is public because it is generic infrastructure. The
skills are private because they are your intellectual property.
