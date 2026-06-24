# Omni Skills

[![npm version](https://img.shields.io/npm/v/ai-omni-skills.svg)](https://www.npmjs.com/package/ai-omni-skills)
[![npm downloads](https://img.shields.io/npm/dm/ai-omni-skills.svg)](https://www.npmjs.com/package/ai-omni-skills)
[![license](https://img.shields.io/npm/l/ai-omni-skills.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/moatazhamada/ai-omni-skills.svg?style=social)](https://github.com/moatazhamada/ai-omni-skills)

![Omni Skills Banner](banner.png)

> **I try every AI tool. My skills scattered everywhere. This unifies them.**

> **🎉 v1.4.0 is out — native binaries for macOS, Linux, and Windows; Homebrew and Winget support; and a skill compiler pipeline. [Read the announcement →](https://github.com/moatazhamada/ai-omni-skills/discussions/2)**

A CLI + MCP server that takes the skills you've collected across all your AI
coding tools and unifies them into a single canonical store. Then it syncs them
into every tool you use — Claude, Codex, Kimi, Gemini, Cursor, Zed, Cline,
Z.AI, and anything else that follows.

If you find this useful, please consider
[starring the repo](https://github.com/moatazhamada/ai-omni-skills) — it helps
us reach the criteria for inclusion in `homebrew/core` so users can run
`brew install omni-skills` without the `brew tap` step.

---

## The Problem This Solves

Every new AI coding tool wants its own instruction file, skill directory, and
configuration. The result is fragmentation:

| Mess | What I Found |
|------|--------------|
| **Duplicate AGENTS.md files** | 70 copies of the same template across 16 projects |
| **Orphaned skills** | 15 skills hidden in a tool's skills directory, invisible to other tools |
| **Marketplace dumps** | 203 generic skills cloned into a project |
| **Stale templates** | Old project-only rules in every repo |
| **Private skills leaking** | Project-specific skills mixed with generic skills |
| **Iron laws drifting** | A 98KB instruction file manually copy-pasted between repos |
| **New tool = manual setup** | Every new AI tool meant copying config files one by one |

Omni Skills is a single-purpose tool: find all your skills, put them in one
place, and wire them into every AI tool you use.

```bash
# One canonical store. Every tool sees it.
omni-skills sync all   # Claude, Codex, Kimi, Gemini, Cursor, Cline, Zed, etc.
```

---

## Install

Choose one of the following. Native binaries do not require Node.js.

```bash
# macOS / Linux
brew tap moatazhamada/tap
brew install omni-skills

# Windows
winget install omni-skills

# npm
npm install -g ai-omni-skills
```

See [docs/install.md](docs/install.md) for details on why `brew tap` is needed
and how each distribution channel works.

---

## Quick Start

You need your own **private** repository for your skills. This toolkit does not
include skills — it connects the skills you already have to every AI tool you
use.

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

Override defaults without questions:

```bash
omni-skills setup --public=~/my-skills-public --private=~/my-skills-private
omni-skills setup --toolkit=/path/to/this/repo
```

---

## What It Does

| Tier | What | Mechanism |
|------|------|-----------|
| **A** | `SKILL.md` skills + shared instructions + MCP server | Symlinks + local MCP server exposing `list_skills` / `read_skill` |
| **B** | Hooks | Canonical hooks transpiled into each tool's native hook format |
| **C** | Other assets | Symlinks from your config repo to per-tool paths |

When you run `omni-skills sync`, each `SKILL.md` is compiled on the fly into the
format each target tool expects. You can also add `executionBoundary` guards in
the YAML frontmatter to restrict file writing, network access, or require shell
execution confirmations per tool.

See [docs/architecture.md](docs/architecture.md) for the full compiler pipeline,
execution boundaries, and MCP server details.

---

## Supported AI Tools

| Tool | Type | Config | Skills Dir | MCP |
|------|------|--------|------------|-----|
| **Claude Code** | CLI | `~/.claude/CLAUDE.md` | ✓ | ✓ |
| **OpenAI Codex** | CLI | `~/.codex/AGENTS.md` | ✓ | ✓ |
| **Kimi** | CLI | `~/.kimi/AGENTS.md` | ✓ | ✓ |
| **Gemini CLI** | CLI | `~/.gemini/GEMINI.md` | — | ✓ |
| **Cursor** | Editor | `~/.cursor/rules/` | — | ✓ |
| **Kilocode** | VS Code | `~/.kilocode/rules/` | ✓ | ✓ |
| **OpenCode** | CLI | `~/.config/opencode/` | — | ✓ |
| **Aider** | CLI | `~/.aider.conf.yml` | — | — |
| **Continue.dev** | VS Code | `~/.continue/config.yaml` | — | ✓ |
| **Cline** | VS Code | `~/.cline/rules.md` | ✓ | ✓ |
| **Roo Code** | VS Code | `~/.roo/rules.md` | ✓ | ✓ |
| **Windsurf** | Editor | `~/.windsurf/rules.md` | — | ✓ |
| **Zed** | Editor | `~/.config/zed/settings.json` | — | ✓ |
| **Tabby** | Self-hosted | `~/.tabby/config.toml` | — | — |
| **PearAI** | Editor | `~/.pearai/config.json` | — | — |
| **Void** | Editor | `~/.void/config.json` | — | — |
| **JetBrains Junie** | IDE | `.junie/guidelines.md` | — | — |
| **JetBrains AI Assistant** | IDE | `.aiassistant/rules/` | — | — |
| **Claude Desktop** | Desktop | `~/Library/…/Claude/…` | — | ✓ |
| **Devin** | Desktop | — | — | — |
| **Factory Droid** | CLI | — | — | — |
| **Z.AI (GLM 5.2)** | Model API | — | — | —¹ |

¹ Z.AI works *through* existing tools. Point Claude Code, Cline, or Zed at the
GLM Coding Plan endpoint. For VS Code Copilot, install the `glm-copilot`
extension.

---

## CLI Commands

| Command | Does |
|---------|------|
| `omni-skills mcp` | Run the MCP server over stdio. |
| `omni-skills index` | Regenerate `INDEX.md` and managed `SHARED.md`. |
| `omni-skills workflow [list\|run <name>]` | List or run chainable skill workflows. |
| `omni-skills sync [tool\|all] [--dry-run]` | Wire instructions, skills dirs, MCP config, hooks, assets. |
| `omni-skills check [--move] [--dry-run]` | Find orphaned skills and dangling symlinks. |
| `omni-skills classify [path] [--depth=N] [--dry-run]` | Scan and sort instruction files public/private. |
| `omni-skills discover` | Scan system for AI tools, instruction files, skill dirs. |
| `omni-skills setup` | Auto-scan, detect tools, generate config. |
| `omni-skills doctor` | Health check symlinks, config, indexes, skill counts. |
| `omni-skills report [--enhance]` | Usage statistics and improvement tips. |
| `omni-skills init [--dry-run]` | Interactive setup: scan, classify, route, wire. |
| `omni-skills security [scan]` | SkillSpector vulnerability scanning. |
| `omni-skills create [name]` | Create a new skill with a wizard. |
| `omni-skills create from <file>` | Convert an existing file into a skill. |
| `omni-skills help` | Show help. |

See [docs/usage.md](docs/usage.md) for detailed usage, real stats, health
checks, verification, and tests.

---

## Documentation

- [Installation options & why `brew tap`](docs/install.md)
- [Architecture: compiler, execution boundaries, MCP server](docs/architecture.md)
- [Workflows: chainable skill sequences](docs/workflows.md)
- [Security scanning with NVIDIA SkillSpector](docs/security.md)
- [Creating new skills](docs/creating-skills.md)
- [How to store your skills](docs/storing-skills.md)
- [Usage guide, health checks, verification](docs/usage.md)

---

## License

MIT — see [LICENSE](LICENSE).
