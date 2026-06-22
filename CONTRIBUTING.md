# Contributing to Omni Skills

**Maintainer:** Moataz Mohamed (motazhamada@gmail.com)

Thanks for your interest in contributing! This project is a toolkit for unifying AI skills across tools — if you use AI coding agents and have ideas, we want to hear them.

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported in [issues](https://github.com/moatazhamada/ai-omni-skills/issues)
2. If not, open a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version, tools installed)

### Suggesting Features

1. Check [discussions](https://github.com/moatazhamada/ai-omni-skills/discussions) for existing ideas
2. Open a new discussion or issue describing:
   - What problem it solves
   - How it would work
   - Which AI tools it would support

### Pull Requests

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run verification: `node verify.js`
6. Commit with a clear message
7. Push and open a PR

### What We're Looking For

- New AI tool configs (check `config.example.json` for the pattern)
- Bug fixes for sync/doctor/setup commands
- Documentation improvements
- Tests for edge cases

### What We Won't Accept

- Skills or instruction files (this repo is toolkit-only)
- Employer-specific or project-specific code
- Anything that reveals private work context

## Development Setup

```bash
git clone https://github.com/moatazhamada/ai-omni-skills.git
cd ai-omni-skills
npm install
npm test
node verify.js
```

## Questions?

Open a [discussion](https://github.com/moatazhamada/ai-omni-skills/discussions) — no question is too small.
