# Installation

Omni Skills is distributed as a standalone native binary and as an npm package.
The native binaries do not require Node.js.

## macOS / Linux — Homebrew (recommended)

```bash
brew tap moatazhamada/tap
brew install omni-skills
```

### Why do I need `brew tap` first?

A **tap** is just an extra Git repository that Homebrew checks for formulas, in
addition to the main `homebrew/core` index. `brew install omni-skills` only
works out of the box for packages that have been accepted into `homebrew/core`,
which has strict notability and build-from-source requirements.

Until Omni Skills reaches that threshold, the tap is the standard way to
distribute pre-built GitHub Release binaries. Running `brew tap
moatazhamada/tap` once tells Homebrew where to find the formula; after that,
`brew install omni-skills` and `brew upgrade omni-skills` work normally.

If you find Omni Skills useful, please consider
[starring the repo](https://github.com/moatazhamada/ai-omni-skills) — it helps
us reach the Homebrew core inclusion criteria sooner.

## Windows — Winget

```powershell
winget install omni-skills
```

This requires the Winget manifest to be merged into `microsoft/winget-pkgs`.
If it is not yet available, download `omni-skills-windows-x64.exe` directly
from the [GitHub Releases](https://github.com/moatazhamada/ai-omni-skills/releases)
page and place it in your `PATH`.

## npm

```bash
npm install -g ai-omni-skills
```

Every release is [published with npm provenance](https://www.npmjs.com/package/ai-omni-skills)
— verifiably linked to a GitHub commit and GitHub Actions workflow.

## GitHub Releases

Download the binary for your platform from the
[releases page](https://github.com/moatazhamada/ai-omni-skills/releases) and
place it in your `PATH`.

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
