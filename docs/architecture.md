# Architecture

## What Omni Skills does

It finds all the skills and instruction files you've accumulated, puts them in
one canonical store, and wires them into every AI tool you use.

```bash
# One canonical store. Every tool sees it.
omni-skills sync all   # Claude, Codex, Kimi, Gemini, Cursor, Cline, Zed, etc.
```

## Three portability tiers

| Tier | What | Mechanism |
|------|------|-----------|
| **A** | `SKILL.md` skills + shared instructions + MCP server | Symlinks + local MCP server exposing `list_skills` / `read_skill` |
| **B** | Hooks | Canonical hooks transpiled into each tool's native hook format |
| **C** | Other assets | Symlinks from your config repo to per-tool paths |

## The compiler pipeline

When you run `omni-skills sync`, each `SKILL.md` is compiled on the fly into the
format the target tool expects:

- **Claude / Cursor / Kimi / OpenCode / KiloCode** → markdown with YAML
  frontmatter.
- **Codex** → `SKILL.md` with the required `name` and `description` YAML
  frontmatter, installed in `~/.agents/skills`.
- **Gemini** → markdown + JSON metadata (`SKILL.metadata.json`).

Optional `scripts/`, `references/`, `assets/`, and `agents/` directories remain
attached to compiled skills with managed symlinks, so multi-file skills keep
working without duplicating their resources.

When Codex sync runs, obsolete Omni-managed output under the former
`~/.codex/skills` location is moved to Omni Skills' recoverable trash. Existing
unmanaged skills and files in that directory are preserved.

The compiler reads the canonical skill, applies tool-specific overrides, and
writes the result into each tool's skills directory.

## Execution boundaries

You can restrict what a skill is allowed to do by adding an `executionBoundary`
block to the YAML frontmatter:

```yaml
---
name: clean-code
version: 1.0.0
scope: general
executionBoundary:
  allowedCapabilities:
    - read_files
    - suggest_edits
  forbiddenCapabilities:
    - execute_shell
    - write_to_disk
  requireUserConfirmationFor:
    - execute_shell
  stopConditions:
    - user_says_stop
---
```

These boundaries are rendered into each compiled skill so every tool sees the
same instructions. They guide agent behavior; they are not a substitute for
the tool's sandbox, approval, or managed-policy enforcement.

## The MCP server

Every AI tool that supports MCP registers this server and can call:

```json
// list_skills — discover what's available
{
  "name": "list_skills",
  "result": [
    {"name": "clean-code", "description": "Pragmatic coding standards..."},
    {"name": "refine-requests", "description": "Refine a task by comparing acceptance criteria..."}
  ]
}

// read_skill — load the full instructions before acting
{
  "name": "read_skill",
  "arguments": {"name": "systematic-debugging"},
  "result": "# Systematic Debugging\n\nNO FIXES WITHOUT ROOT CAUSE..."
}
```

Skills are discovered from your private skill repos, live-reloaded when files
change, and exposed as both **tools** and **prompts**.

---

## Documentation index

- [README](../README.md) — overview, install, quick start
- [Installation options & why `brew tap`](install.md)
- [Architecture: compiler, execution boundaries, MCP server](architecture.md)
- [Workflows: chainable skill sequences](workflows.md)
- [Security scanning with NVIDIA SkillSpector](security.md)
- [Creating new skills](creating-skills.md)
- [How to store your skills](storing-skills.md)
- [Usage guide, health checks, verification](usage.md)
