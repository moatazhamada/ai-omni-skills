# Changelog

## [1.2.20] - 2026-06-22

### Added
- `postinstall.js` — welcome message after `npm install -g ai-omni-skills`
- `cli.js` — quick-start hint in help output

## [1.2.19] - 2026-06-22

### Changed
- Rename CLI command from `skills` to `omni-skills` (`skills` kept as backward-compatible alias)
- Update all documentation examples to use `omni-skills`

## [1.2.18] - 2026-06-22

### Changed
- Updated example patterns in content detection modules to use generic placeholders
- Removed outdated tooling scan report

## [1.2.7] - 2026-06-22

### Fixed
- `lib/doctor.js`: Handle arrays in `skillsDir` (Kimi dual directory support) — `omni-skills doctor` now works with the array format introduced in v1.2.1

### Changed
- CI/CD auto-release workflow triggers on package.json changes

## [1.2.6] - 2026-06-22

### Added
- npm provenance — every release is verifiably linked to a GitHub commit and GitHub Actions workflow
- `.github/workflows/publish.yml` — auto-publishes on release with `--provenance`
- `.github/workflows/auto-release.yml` — auto-creates GitHub release on version bump push

## [1.2.5] - 2026-06-22

### Changed
- Final version bump consolidating all features

## [1.2.4] - 2026-06-22

### Added
- npm badges to README (version, downloads, license, stars)
- npm provenance note in README

## [1.2.3] - 2026-06-22

### Added
- Author attribution and copyright protection
- `LICENSE`: Copyright now includes author name + email, strengthened attribution clause
- `NOTICE`: New file asserting canonical source and authorship
- `README.md` + `CONTRIBUTING.md`: Author / Maintainer lines

## [1.2.2] - 2026-06-22

### Fixed
- Kimi CLI dual skills directory sync
- `lib/sync.js`: `wireSkillsDir` now accepts arrays of directories
- Syncs to both `~/.kimi/skills/` and `~/.kimi-code/skills/`
- Original native skills backed up to `.skills-bak/`

### Changed
- `mcpServerName`: renamed from `skills` to `omni-skills`

## [1.2.1] - 2026-06-22

### Fixed
- `lib/doctor.js`: Expected regular files (Claude, OpenCode) show ✓ instead of ⚠
- Checks `instructionMode` to determine if a regular file is expected

## [1.2.0] - 2026-06-22

### Added
- Advanced workflows with loops, goals, conditions, retries, and parallel steps
  - `loop`: Repeat a skill sequence until a condition is met (e.g., refine until approved)
  - `condition`: Branch based on a check (e.g., if complex → full plan, else → minimal tasks)
  - `parallel`: Run quality checks concurrently (e.g., lint + test + analyze at once)
  - `goal`: Success criteria for every step — clear "done" condition
  - `max_retries`: Auto-retry failed steps before giving up
- `lib/workflows.js` — workflow engine supporting all step types
- 14 new unit tests for workflow validation, counting, and prompt generation
- `examples/workflows/advanced-feature-dev/` — comprehensive example using all features
- Workflow documentation in README with step types table

## [1.0.0] - 2026-06-22

### Added
- Initial release of Omni Skills
- CLI with 11 commands: `sync`, `doctor`, `setup`, `discover`, `classify`, `check`, `report`, `index`, `init`, `mcp`, `help`
- MCP server exposing `list_skills` and `read_skill` to any AI tool that supports MCP
- Auto-scan setup: detects installed AI tools, finds skill directories, suggests cleanup
- Config support for 26 AI tools: Claude, Codex, Kimi, Gemini, Cursor, Kilocode, OpenCode, Cline, Roo, Windsurf, Zed, Aider, Continue, Tabby, PearAI, Void, Supermaven, Augment, Codeium, Copilot, Junie, AI Assistant, Claude Desktop, Devin, Factory Droid, Z.AI (GLM 5.2)
- 24-check verification suite (`verify.js`)
- 14 unit tests with Node's built-in test runner
- Weekly health check cron support (`omni-skills doctor`)
- `.mailmap` for contributor consolidation
- GitHub Actions CI workflow for tests

### Notes
- Z.AI (GLM 5.2) works through existing tools. Use Claude Code, Cline, or Zed with a GLM Coding Plan key. For VS Code Copilot, install the `glm-copilot` extension.
