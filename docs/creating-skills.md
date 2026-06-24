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
