# 🔒 Security Scanning (NVIDIA SkillSpector)

Research shows **26.1% of AI skills contain vulnerabilities** and **5.2% show
likely malicious intent**. Omni Skills integrates with
[NVIDIA SkillSpector](https://github.com/NVIDIA/skillspector) to scan your
skills before you install them.

SkillSpector detects **64 vulnerability patterns** across **16 categories**:

- Prompt injection, data exfiltration, privilege escalation
- Supply chain attacks, malware, credential harvesting
- Excessive agency, tool misuse, system prompt leakage

## Quick Start

```bash
# Check SkillSpector status
omni-skills security

# Scan all skills in your canonical store
omni-skills security scan

# Scan without LLM (faster, static analysis only)
omni-skills security scan --no-llm

# Scan a specific skill directory
omni-skills security scan ~/my-skills-private/clean-code
```

## Install SkillSpector

```bash
git clone https://github.com/NVIDIA/skillspector.git
cd skillspector
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
```

Or use Docker:

```bash
docker run --rm -v "$PWD:/scan" ghcr.io/nvidia/skillspector scan /scan
```

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
