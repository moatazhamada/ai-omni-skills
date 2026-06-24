# ✨ Creating New Skills

Instead of creating skills through an agent and then moving them, create them
directly:

```bash
# Interactive wizard
omni-skills create

# With name and description
omni-skills create refine-requests "Refine ticket acceptance criteria"

# Convert an existing file into a skill
omni-skills create from ./my-instructions.md

# Then index and sync
omni-skills index
omni-skills sync all
```

This creates a `SKILL.md` with proper frontmatter in your private skills store.

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
