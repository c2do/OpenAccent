#!/usr/bin/env bash
# Builds openaccent.mcpb: a one-click Claude Desktop extension (runs locally, no server).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
stage=$(mktemp -d)
cp manifest.json package.json package-lock.json LICENSE "$stage/"
cp docs/assets/icon.png "$stage/icon.png"
cp -r dist "$stage/dist"
(cd "$stage" && npm ci --omit=dev --ignore-scripts --silent)
npx --yes @anthropic-ai/mcpb@2 validate "$stage/manifest.json"
npx --yes @anthropic-ai/mcpb@2 pack "$stage" openaccent.mcpb
rm -rf "$stage"
echo "Built openaccent.mcpb"
