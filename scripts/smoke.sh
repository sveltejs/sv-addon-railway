#!/usr/bin/env bash
# Regenerates ./template-postgres: drizzle + better-auth + this addon.
# template-postgres/ is what the Railway template deploys (rootDirectory: /template-postgres).
# Everything here must be reproducible: never hand-edit template-postgres/.
set -euo pipefail
cd "$(dirname "$0")/.."
root=$(pwd)

rm -rf template-postgres
npx sv@latest create template-postgres \
	--template minimal --types ts \
	--add drizzle="database:postgresql+client:postgres.js+docker:yes" \
	better-auth="demo:password" \
	"file:$root"="projectName:Svelte & Railway starter+enableStyle:yes" \
	--install pnpm --no-download-check

cd template-postgres
# the better-auth addon leaves a stub schema; the real one must be committed for the template
pnpm auth:schema
# Railpack defaults to pnpm 9 (rejects the generated workspace file); 11+ breaks onlyBuiltDependencies
pnpm pkg set packageManager=pnpm@$(npm view pnpm dist-tags.latest-10)

# README: template title + deploy button, then the `sv` sections, with no local add-on path
{
	cat "$root/scripts/template-readme-header.md"
	echo
	sed -e "s|file:$root=|sv-addon-railway=|" -e '1,/^## /{/^## /!d}' README.md
} > README.next && mv README.next README.md

# sanity: build like Railway does (env vars are provided by the template at build time)
DATABASE_URL=postgres://build:build@localhost:5432/build BETTER_AUTH_SECRET=build pnpm build
rm -rf build .svelte-kit node_modules

echo
echo "--- template-postgres/.railway/railway.ts ---"
cat .railway/railway.ts
