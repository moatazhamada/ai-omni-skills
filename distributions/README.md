# Native Distribution Assets

This directory contains the manifests needed to distribute Omni Skills through
native package managers. The actual binaries are built by GitHub Actions and
attached to each GitHub Release.

## Release workflow

1. Bump the version in `package.json` and `lib/version.js`.
2. Push the version tag:
   ```bash
   git tag v1.3.2
   git push origin v1.3.2
   ```
3. Wait for `.github/workflows/release-binaries.yml` to finish. It uploads:
   - `omni-skills-linux-x64`
   - `omni-skills-mac-arm64`
   - `omni-skills-mac-x64`
   - `omni-skills-windows-x64.exe`
4. Run the helper script to download the release assets and print their SHA256
   hashes:
   ```bash
   ./distributions/update-distribution-assets.sh 1.3.2
   ```
5. Paste the printed hashes into:
   - `../homebrew-tap/Formula/omni-skills.rb`
   - `distributions/winget/moatazhamada.omni-skills.installer.yaml`
6. Commit and push the updated manifest files.
7. Submit the Winget manifests to
   [`microsoft/winget-pkgs`](https://github.com/microsoft/winget-pkgs) with
   [`wingetcreate`](https://github.com/microsoft/winget-create) or a manual PR.

## Homebrew

Mac and Linux users can install the standalone binary via the tap repository:

```bash
brew tap moatazhamada/tap
brew install omni-skills
```

The tap repository lives at `moatazhamada/homebrew-tap`.

## Winget

Windows users can install the standalone binary once the manifest is accepted
into `microsoft/winget-pkgs`:

```bash
winget install omni-skills
```

Until then, users can download `omni-skills-windows-x64.exe` directly from the
GitHub Release page.
