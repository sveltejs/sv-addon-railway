#!/usr/bin/env bash
# Smoke test: scaffold an app with drizzle + better-auth + this addon.
# The generated app in ./snapshot is what gets pushed to kit-template-railway.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf snapshot
npx sv@latest create snapshot \
	--template minimal --types ts \
	--add drizzle="database:postgresql+client:postgres.js+docker:yes" \
	better-auth="demo:password" \
	"file:$(pwd)"="projectName:Svelte & Railway starter" \
	--no-install --no-download-check

echo
echo "--- snapshot/.railway/railway.ts ---"
cat snapshot/.railway/railway.ts
