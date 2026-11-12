# Release v1.6.0

## Omni Skills 1.6.0 — security hardening release

**No breaking changes.** Drop-in upgrade from any v1.5.x install.

### Highlights

- **0 known vulnerabilities.** `npm audit` reports a clean tree. The MCP
  TypeScript SDK is upgraded to `^1.32.2` (three high-severity advisories) and
  `js-yaml` to `^4.3.2`. The unmaintained `gray-matter` dependency is gone,
  which also removes its nested vulnerable `js-yaml@3.14.2`.
- **Explicit MCP tool annotations.** `list_skills` and `read_skill` now declare
  `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` as
  booleans. Directories such as OpenAI's reject tools with missing or
  non-boolean hints.
- **Lighter front-matter parser.** `lib/frontmatter.js` parses SKILL.md and
  WORKFLOW.md front matter directly with `js-yaml`, keeping the fallback for
  malformed YAML (for example an unquoted colon in a description).
- **Fixed MCP server lifetime.** The stdio server stays alive until the client
  disconnects instead of being torn down right after `connect()`.

### Install / upgrade

npm:

```bash
npm install -g ai-omni-skills@1.6.0
```

Homebrew (macOS / Linux):

```bash
brew tap moatazhamada/tap
brew install omni-skills
# already installed:
brew upgrade omni-skills
```

Windows (Winget):

```powershell
winget upgrade moatazhamada.omni-skills
```

Standalone binaries:
https://github.com/moatazhamada/ai-omni-skills/releases/tag/v1.6.0

### Compatibility

- Requires Node.js >= 18.
- No CLI commands, flags, config keys or file formats changed.
- Published to npm with provenance attestation.

### Verification

- `npm audit`: 0 vulnerabilities.
- Full test suite passing in CI, including new coverage for the advertised MCP
  tool contract and the front-matter parser.
- Release binaries are built from the tagged commit by GitHub Actions; their
  SHA256 digests are the ones published in the Homebrew and Winget manifests.

Full changelog: [CHANGELOG.md](CHANGELOG.md)
