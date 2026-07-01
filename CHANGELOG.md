# Changelog

## [1.5.3] - 2026-07-01

### Fixed
- **npm global channel detection** — the npm bin shim (`~/.npm-global/bin/omni-skills`)
  is now resolved to the package directory so `omni-skills update` correctly reports
  "npm package" and runs `npm install -g` instead of showing the native-binary
  download instruction.

## [1.5.2] - 2026-07-01

### Added
- **Channel-aware updates** — `omni-skills update` now detects how it was
  installed (npm, Homebrew, Winget, or direct binary) and runs the matching
  upgrade command instead of always using `npm install -g`.
- **Install-source detection** — the version banner and update prompt now show
  the active channel (e.g. "npm package", "Homebrew formula").
- **Duplicate-installation detection in doctor** — `omni-skills doctor` scans
  PATH for multiple `omni-skills` binaries, reports which one is active, which
  are shadowed, and warns when stale copies could hide updates.

### Fixed
- **Correct update command for non-npm installs** — Homebrew and Winget users
  no longer receive the npm upgrade instruction.

## [1.5.1] - 2026-07-01

### Fixed
- **Version reporting mismatch** — the published `v1.5.0` tarball reported its
  own version as `v1.4.0` because `lib/version.js` was not bumped before publish.
  `omni-skills --version` and the update checker now correctly report `v1.5.1`.

## [1.5.0] - 2026-06-26

### Added
- **Automatic pre-sync backup** — `omni-skills sync` now copies affected
  instruction files, MCP configs, hooks files, and the skills config to
  `~/.config/skills/backups/<timestamp>/` before writing. Skipped with
  `--dry-run` or `--no-backup`; old backups pruned after 30 days.
- **Session-aware consent** — `OMNI_SKILLS_SESSION_YES=1` skips confirmation
  prompts for the current shell only, safer than `--yes` for batch workflows.
- **Idempotent compiled-skill sync** — unchanged skills are no longer rewritten,
  making repeated `sync` calls quiet and fast.

### Changed
- **CLI command consolidation** — secondary commands moved under
  `omni-skills manage <subcommand>`: `mcp`, `index`, `workflow`, `check`,
  `classify`, `discover`, `report`, `init`, `security`, `create`, `uninstall`.
  Core surface is now `sync`, `setup`, `doctor`, `restore`, `update`, `help`.
  Legacy top-level commands still work for backward compatibility.
- **Simplified setup** — removed interactive SkillSpector, cron scheduling, and
  remote-backup prompts from `setup`. Optional next steps are printed instead.
- **README / usage docs** — rewritten to explain the smaller core surface,
  backup behavior, session consent, and the relationship to `ai-tool-router`.

## [1.4.0] - 2026-06-24

### Added
- **Native binary distribution** — standalone executables for macOS (arm64/x64), Linux (x64), and Windows (x64) built automatically on every release via Bun compile and GitHub Actions.
- **Homebrew tap** — install on macOS and Linux without Node.js:
  ```bash
  brew tap moatazhamada/tap
  brew install omni-skills
  ```
- **Winget manifest** — Windows users can install via `winget install omni-skills` once the manifest is accepted into `microsoft/winget-pkgs`.
- **Skill compiler pipeline** — `SKILL.md` files are now compiled on the fly into the native format expected by each AI tool (Claude/Cursor/Kimi/OpenCode/KiloCode markdown+YAML, Codex markdown+TOML, Gemini markdown+JSON).
- **Execution boundaries** — YAML frontmatter can now restrict file writing, network access, shell execution, and require user confirmation per tool.
- **Zero-config fallback** — legacy skills without YAML frontmatter are still detected and synced using directory-inferred metadata.
- **Optional SkillSpector gate** — opt-in automated vulnerability scanning during the sync process.
- **Documentation split** — README is now concise; detailed guides live in `docs/`.

### Changed
- CLI is now decoupled from Node runtime assumptions (`__dirname` package.json reads, example config reads) so compiled binaries work without a Node installation.
- npm package now uses a `files` whitelist to stay lightweight.

### Fixed
- `sync all --dry-run` no longer crashes when a tool has `instructionFile: null`.
- npm publish is now independent of GitHub Release creation so future tag releases publish to npm reliably.

## [1.2.22] - 2026-06-22

### Added
- **NVIDIA SkillSpector integration** — security scanning for AI skills
  - `omni-skills security` — check SkillSpector status
  - `omni-skills security scan` — scan skills for 64 vulnerability patterns
  - Setup asks to install SkillSpector (default: yes)
  - Doctor checks SkillSpector installation status
  - README documents SkillSpector with NVIDIA reference
- **Skill creation wizard** — create skills directly without going through an agent
  - `omni-skills create [name]` — interactive wizard with SKILL.md template
  - `omni-skills create from <file>` — convert existing file to skill
- **Help hint** — quick-start banner at bottom of `omni-skills help`

### Changed
- Rename CLI command from `skills` to `omni-skills` (`skills` kept as backward-compatible alias)
- Update all documentation examples to use `omni-skills`

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
