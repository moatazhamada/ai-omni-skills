# Usage Guide

## The `omni-skills` CLI

| Command | Does |
|---------|------|
| `omni-skills mcp` | Run the MCP server over stdio (what each tool launches). |
| `omni-skills index` | Regenerate `INDEX.md` files and the managed `SHARED.md` skill block. |
| `omni-skills workflow [list\|run <name>]` | List chainable skill workflows or run one. |
| `omni-skills sync [tool\|all] [--dry-run]` | Wire instructions, skills dirs, MCP config, hooks, and assets. |
| `omni-skills check [--move] [--dry-run]` | Find orphaned skills and dangling/foreign symlinks. |
| `omni-skills classify [path] [--depth=N] [--dry-run]` | Scan for instruction files, detect sensitive content, sort public/private. |
| `omni-skills discover` | Scan your entire system for AI tools, instruction files, skill directories, and projects. |
| `omni-skills setup` | Auto-scan system, detect tools, suggest cleanup, generate config. |
| `omni-skills doctor` | Health check: verify symlinks, config, indexes, and skill counts. |
| `omni-skills report [--enhance]` | Usage statistics and heuristic improvement tips. |
| `omni-skills init [--dry-run]` | Interactive setup: scan, classify, route, wire. |
| `omni-skills security [scan]` | Check/install NVIDIA SkillSpector. Scan skills for vulnerabilities. |
| `omni-skills create [name]` | Create a new skill with interactive wizard. |
| `omni-skills create from <file>` | Convert an existing file into a skill. |
| `omni-skills help` | Show help. |

## Quick Start

```bash
# 1. Run the auto-scan setup
omni-skills setup
# Auto-detects your installed AI tools, finds your skill directories,
# suggests cleanup, and generates ~/.config/skills/config.json

# 2. Sync to every AI tool
omni-skills sync all

# 3. Verify health
omni-skills doctor

# 4. Run the verification suite
node verify.js
```

### Setup Flags

```bash
# Override defaults without questions
omni-skills setup --public=~/my-skills-public --private=~/my-skills-private
omni-skills setup --toolkit=/path/to/this/repo
```

## How I Use This (Real Stats)

My personal setup — after unifying:

| Metric | Value |
|--------|-------|
| **AI tools wired** | 9 (Claude, Codex, Kimi, Gemini, Cursor, Kilocode, OpenCode, Windsurf, Claude Desktop) |
| **Skills in canonical store** | 49 (all private, all mine) |
| **Stale template files deleted** | 77 — eliminated duplicate AGENTS.md/GEMINI.md copies |
| **Orphaned skills rescued** | 15 — from `~/.kimi/skills/` to canonical store |
| **Duplicate skills removed** | 15 — from a project's marketplace clone |
| **Generic marketplace skills archived** | 203 — removed from active project, not lost |
| **Weekly health check** | Auto-runs `omni-skills doctor` every Sunday at 9:17 AM |
| **Instruction files moved to canonical** | 5 — project-specific rules, no more drift |
| **Core project rules** | 98KB file, single source, symlinked to 2 other repos |
| **New tool onboarding** | `omni-skills sync <tool>` — one command |

## Weekly Health Check

A scheduled `cron` job runs `omni-skills doctor` every Sunday morning to catch
drift before it becomes a problem:

```bash
omni-skills doctor    # Check all symlinks, config, indexes
omni-skills check     # Scan for orphaned skills
omni-skills report    # Usage stats and improvement tips
```

## Verification

Before trusting the system, verify it:

```bash
node verify.js
# === Skills Ecosystem Verification ===
# [config]        ✓ loads successfully
# [skill paths]   ✓ 2 paths exist
# [skills scan]   ✓ 49 skills found, no duplicates
# [skill files]   ✓ all files valid
# [SHARED.md]     ✓ exists
# [instruction]   ✓ 6 symlinks + 1 regular valid
# [skills dirs]   ✓ 4 tools, 49 skills each, all healthy
# [MCP configs]   ✓ 7 tools, all have skills server
# ✓ ALL CHECKS PASSED (24 passed)
```

## Tests

```bash
npm test
```

28 tests, Node's built-in runner, no extra dependencies. Covers:

- `sensitive.js` — denylist detection (company names, ticket IDs, API keys, internal URLs)
- `fs-utils.js` — symlink management, managed block insertion/updates
- `skills.js` — skill scanning, frontmatter parsing, hidden directory filtering

CI runs on every push via GitHub Actions.

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
