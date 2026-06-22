# Release v1.0.0

## Omni Skills — Initial Release

**For AI enthusiasts who try every new tool and watch their skills fragment.**

### What This Is

A CLI + MCP server that takes the skills you've collected across all your AI coding tools and unifies them into a single canonical private store. Then it syncs them into every tool you use — Claude, Codex, Kimi, Gemini, Cursor, Zed, Cline, and anything else that follows.

### What's Included

- **11 CLI commands** — `sync`, `doctor`, `setup`, `discover`, `classify`, `check`, `report`, `index`, `init`, `mcp`, `help`
- **MCP server** — exposes `list_skills` and `read_skill` to any AI tool that supports MCP
- **Auto-scan setup** — detects installed AI tools, finds skill directories, suggests cleanup, generates config
- **26 AI tool configs** — Claude, Codex, Kimi, Gemini, Cursor, Kilocode, OpenCode, Cline, Roo, Windsurf, Zed, Aider, Continue, Tabby, PearAI, Void, Supermaven, Augment, Codeium, Copilot, Junie, AI Assistant, Claude Desktop, Devin, Factory Droid, **Z.AI (GLM 5.2)**
- **24-check verification suite** — run `node verify.js` to verify your setup
- **14 unit tests** — Node's built-in test runner, no extra dependencies
- **Weekly health check** — `skills doctor` via cron to catch drift

### Z.AI (GLM 5.2) Support

Z.AI works through existing tools. Use Claude Code, Cline, or Zed with a GLM Coding Plan key. For VS Code Copilot, install the `glm-copilot` extension.

### Install

```bash
git clone https://github.com/moatazhamada/ai-omni-skills.git
cd ai-omni-skills
npm link
skills setup
skills sync all
```

Or via npm (coming soon):

```bash
npm install -g omni-skills
skills setup
skills sync all
```

### What's NOT Included (By Design)

- No skills. Your skills live in your private repo.
- No instruction files. Those are your intellectual property.

### Star & Contribute

If this helps you, give it a star ⭐

- [Open an issue](https://github.com/moatazhamada/ai-omni-skills/issues) — bug reports, feature requests, questions
- [Open a discussion](https://github.com/moatazhamada/ai-omni-skills/discussions) — ideas, show-and-tell, Q&A
- [Open a PR](https://github.com/moatazhamada/ai-omni-skills/pulls) — contributions welcome

---

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)
