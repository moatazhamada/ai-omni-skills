/**
 * Embedded fallback configuration.
 *
 * This object replaces runtime reading of config.example.json. It is used when
 * no user config exists at $SKILLS_CONFIG or ~/.config/skills/config.json.
 * Keeping it in code means standalone native binaries work even though they
 * cannot resolve __dirname to a real package directory.
 */
export const DEFAULT_CONFIG = {
  "$comment": "Copy this file to ~/.config/skills/config.json, then edit skillPaths, publicPath, and privatePath to point at YOUR skills repos. The toolkit code stays in its own public repo.",
  "toolkitDir": "~/path/to/this/toolkit",
  "publicPath": "~/my-skills-public",
  "privatePath": "~/my-skills-private",
  "skillPaths": [
    "~/my-skills-public",
    "~/my-skills-private"
  ],
  "workflowPaths": [
    "~/my-skills-private/workflows"
  ],
  "sharedFile": "~/my-skills-public/SHARED.md",
  "indexTargets": [
    "~/my-skills-public",
    "~/my-skills-private"
  ],
  "usageLog": "~/.config/skills/usage.jsonl",
  "mcpServerName": "skills",
  "mcpCommand": "node",
  "mcpArgs": [
    "~/path/to/this/toolkit/cli.js",
    "mcp"
  ],
  "hooks": [
    {
      "event": "SessionStart",
      "matcher": "startup",
      "command": "echo 'Welcome. Call list_skills / read_skill before acting on matching tasks.'"
    }
  ],
  "assets": [
    {
      "name": "example agent asset",
      "source": "assets/agents/example-agent.md",
      "target": "~/.claude/agents/example-agent.md"
    }
  ],
  "tools": {
    "claude": {
      "instructionFile": "~/.claude/CLAUDE.md",
      "instructionMode": "import",
      "skillsDir": "~/.claude/skills",
      "mcp": { "file": "~/.claude/.mcp.json", "format": "mcpServers" },
      "hooks": { "file": "~/.claude/settings.json", "format": "claude-json" }
    },
    "codex": {
      "instructionFile": "~/.codex/AGENTS.md",
      "instructionMode": "symlink",
      "skillsDir": "~/.agents/skills",
      "mcp": { "file": "~/.codex/config.toml", "format": "codex-toml" },
      "hooks": { "file": "~/.codex/config.toml", "format": "codex-toml" }
    },
    "kimi": {
      "instructionFile": "~/.kimi/AGENTS.md",
      "instructionMode": "symlink",
      "skillsDir": ["~/.kimi/skills", "~/.kimi-code/skills"],
      "mcp": { "file": "~/.kimi/mcp.json", "format": "mcpServers" },
      "hooks": null
    },
    "gemini": {
      "instructionFile": "~/.gemini/GEMINI.md",
      "instructionMode": "symlink",
      "skillsDir": null,
      "mcp": { "file": "~/.gemini/settings.json", "format": "mcpServers" },
      "hooks": { "file": "~/.gemini/settings.json", "format": "gemini-json" }
    },
    "opencode": {
      "instructionFile": "~/.config/opencode/opencode.jsonc",
      "instructionMode": "opencode-instructions",
      "skillsDir": null,
      "mcp": { "file": "~/.config/opencode/opencode.jsonc", "format": "opencode" },
      "hooks": null
    },
    "cursor": {
      "instructionFile": "~/.cursor/rules/shared-skills.md",
      "instructionMode": "symlink",
      "skillsDir": null,
      "mcp": { "file": "~/.cursor/mcp.json", "format": "mcpServers" },
      "hooks": null
    },
    "kilocode": {
      "instructionFile": "~/.kilocode/rules/shared-skills.md",
      "instructionMode": "symlink",
      "skillsDir": "~/.kilocode/skills",
      "mcp": { "file": "~/Library/Application Support/Code/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json", "format": "mcpServers" },
      "hooks": null
    },
    "aider": {
      "instructionFile": "~/.aider.conf.yml",
      "instructionMode": "aider-config",
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "continue": {
      "instructionFile": "~/.continue/config.yaml",
      "instructionMode": "continue-instructions",
      "skillsDir": null,
      "mcp": { "file": "~/.continue/config.yaml", "format": "continue" },
      "hooks": null
    },
    "cline": {
      "instructionFile": "~/.cline/rules.md",
      "instructionMode": "symlink",
      "skillsDir": "~/.cline/skills",
      "mcp": { "file": "~/.cline/mcp.json", "format": "mcpServers" },
      "hooks": null
    },
    "roo": {
      "instructionFile": "~/.roo/rules.md",
      "instructionMode": "symlink",
      "skillsDir": "~/.roo/skills",
      "mcp": { "file": "~/.roo/mcp.json", "format": "mcpServers" },
      "hooks": null
    },
    "windsurf": {
      "instructionFile": "~/.windsurf/rules.md",
      "instructionMode": "symlink",
      "skillsDir": null,
      "mcp": { "file": "~/.windsurf/mcp.json", "format": "mcpServers" },
      "hooks": null
    },
    "zed": {
      "instructionFile": "~/.config/zed/settings.json",
      "instructionMode": "zed-instructions",
      "skillsDir": null,
      "mcp": { "file": "~/.config/zed/settings.json", "format": "zed" },
      "hooks": null
    },
    "supermaven": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "tabby": {
      "instructionFile": "~/.tabby/config.toml",
      "instructionMode": "tabby-config",
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "pearai": {
      "instructionFile": "~/.pearai/config.json",
      "instructionMode": "pearai-config",
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "void": {
      "instructionFile": "~/.void/config.json",
      "instructionMode": "void-config",
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "augment": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "codeium": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "copilot": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "junie": {
      "instructionFile": "~/.junie/guidelines.md",
      "instructionMode": "symlink",
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "aiassistant": {
      "instructionFile": "~/.aiassistant/rules.md",
      "instructionMode": "symlink",
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "claude-desktop": {
      "instructionFile": "~/Library/Application Support/Claude/claude_desktop_config.json",
      "instructionMode": "claude-desktop-config",
      "skillsDir": null,
      "mcp": { "file": "~/Library/Application Support/Claude/claude_desktop_config.json", "format": "claude-desktop" },
      "hooks": null
    },
    "devin": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "factory-droid": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null
    },
    "zai": {
      "instructionFile": null,
      "instructionMode": null,
      "skillsDir": null,
      "mcp": null,
      "hooks": null,
      "note": "GLM 5.2 works through existing tools. Use Claude Code, Cline, or Zed with a GLM Coding Plan key. For VS Code Copilot, install the glm-copilot extension."
    }
  }
};
