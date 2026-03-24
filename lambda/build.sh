#!/usr/bin/env bash
set -euo pipefail

# Build the Lambda deployment package.
# Creates dist/ with handler + bundled scripts + node_modules.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST="$SCRIPT_DIR/dist"

echo "=== Building Lambda package ==="

# Clean
rm -rf "$DIST"
mkdir -p "$DIST/scripts"

# Copy handler
cp "$SCRIPT_DIR/handler.js" "$DIST/"
cp "$SCRIPT_DIR/package.json" "$DIST/"

# Copy pipeline scripts
cp "$REPO_ROOT/scripts/parse-sources.js" "$DIST/scripts/"
cp "$REPO_ROOT/scripts/collect.js"       "$DIST/scripts/"
cp "$REPO_ROOT/scripts/build.js"         "$DIST/scripts/"
cp "$REPO_ROOT/scripts/test-feeds.js"    "$DIST/scripts/"
cp "$REPO_ROOT/scripts/package.json"     "$DIST/scripts/"

# Install scripts dependencies (rss-parser)
cd "$DIST/scripts"
npm install --omit=dev --ignore-scripts
cd "$DIST"

echo ""
echo "=== Build complete ==="
echo "Package: $DIST/"
echo "Size: $(du -sh "$DIST" | cut -f1)"
echo ""
echo "To deploy:"
echo "  cd lambda"
echo "  sam deploy --guided"
