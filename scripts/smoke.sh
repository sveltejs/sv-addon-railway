#!/usr/bin/env bash
# Regenerates ./snapshot: drizzle + better-auth + this addon.
# snapshot/ is what the Railway template deploys (rootDirectory: /snapshot).
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf snapshot
npx sv@latest create snapshot \
	--template minimal --types ts \
	--add drizzle="database:postgresql+client:postgres.js+docker:yes" \
	better-auth="demo:password" \
	"file:$(pwd)"="projectName:Svelte & Railway starter" \
	--install pnpm --no-download-check

cd snapshot
# the better-auth addon leaves a stub schema; the real one must be committed for the template
pnpm auth:schema

# README: no local path, and a deploy button on top
sed -i "s|file:$(dirname "$(pwd)")=|sv-addon-railway=|" README.md
sed -i '1,3c\
# Svelte \& Railway starter\
\
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/svelte-kit)\
\
SvelteKit + Drizzle (Postgres) + Better Auth, generated with [`sv`](https://github.com/sveltejs/cli) and the [railway add-on](../README.md). Deploys to Railway with one click, or via `railway config apply` (see `.railway/railway.ts`).' README.md

# sanity: build like Railway does (env vars are provided by the template at build time)
DATABASE_URL=postgres://build:build@localhost:5432/build BETTER_AUTH_SECRET=build pnpm build
rm -rf build .svelte-kit node_modules

echo
echo "--- snapshot/.railway/railway.ts ---"
cat .railway/railway.ts
echo "--- snapshot/railway.json ---"
cat railway.json
