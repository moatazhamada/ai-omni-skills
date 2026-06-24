#!/bin/bash
set -euo pipefail

# Downloads release binaries and prints their SHA256 hashes so they can be
# pasted into the Homebrew formula and Winget installer manifest.

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.3.2"
  exit 1
fi

REPO="moatazhamada/ai-omni-skills"
RELEASE_URL="https://github.com/${REPO}/releases/download/v${VERSION}"

ASSETS=(
  "omni-skills-linux-x64"
  "omni-skills-mac-arm64"
  "omni-skills-mac-x64"
  "omni-skills-windows-x64.exe"
)

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

for asset in "${ASSETS[@]}"; do
  echo "Downloading ${asset}..."
  curl -fsSL -o "${TEMP_DIR}/${asset}" "${RELEASE_URL}/${asset}"
done

echo ""
echo "SHA256 hashes:"
for asset in "${ASSETS[@]}"; do
  hash=$(shasum -a 256 "${TEMP_DIR}/${asset}" | awk '{print $1}')
  echo "${asset}: ${hash}"
done

echo ""
echo "Paste these hashes into:"
echo "  - ../homebrew-tap/Formula/omni-skills.rb"
echo "  - distributions/winget/moatazhamada.omni-skills.installer.yaml"
