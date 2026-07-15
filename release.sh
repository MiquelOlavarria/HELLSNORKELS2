#!/bin/bash
# Release HELLSNORKELS 2: deploy + git commit + push to GitHub
# Usage: ./release.sh [patch|minor|major]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUMP="${1:-patch}"

echo "=== HELLSNORKELS 2 - Release ==="
echo ""

# 1. Deploy (bumps version + SFTP upload)
echo ">>> Step 1: Deploying..."
bash "$SCRIPT_DIR/deploy.sh" "$BUMP"
if [ $? -ne 0 ]; then
  echo "ERROR: Deploy failed. Aborting release."
  exit 1
fi

# 2. Git commit
echo ""
echo ">>> Step 2: Git commit..."
cd "$SCRIPT_DIR"
NEW_VER=$(grep -oP "const vTxt='v\K[^']+" game.js | head -1)
git add -A
git commit -m "Release $NEW_VER"

# 3. Git push
echo ""
echo ">>> Step 3: Pushing to GitHub..."
git push

echo ""
echo "=== Release $NEW_VER complete ==="
