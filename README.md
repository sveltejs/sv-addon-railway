# sv-addon-railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/svelte-kit)

Community [Svelte CLI](https://svelte.dev/docs/cli) add-on that makes a SvelteKit app deployable
on [Railway](https://railway.com), based on the other add-ons you selected.

```bash
npx sv create my-app --add drizzle better-auth sv-addon-railway
cd my-app
railway login && railway link && railway config apply
```

What it does:

- switches the app to `@sveltejs/adapter-node` and adds a `start` script (`node build`)
- writes `railway.json` (start + pre-deploy commands, used by GitHub / template deploys)
- writes `.railway/railway.ts` ([Infrastructure as Code](https://docs.railway.com/infrastructure-as-code), used by `railway config apply`): a `web` service, plus a `postgres` database with `DATABASE_URL` wiring when drizzle + postgres are detected
- adds the `railway` package for the `railway/iac` types

## Options

| option        | default          | description          |
| ------------- | ---------------- | -------------------- |
| `projectName` | the package name | Railway project name |

```bash
npx sv add sv-addon-railway="projectName:My app"
```

## Template

`snapshot/` is the generated reference app ("Svelte & Railway starter": drizzle + better-auth + this add-on).
It backs the [svelte-kit template](https://railway.com/deploy/svelte-kit) on Railway.

Template config (set in the Railway template composer, not in this repo):

- source: `sveltejs/sv-addon-railway`, root directory `/snapshot`
- a `Postgres` database service
- variables on the web service:
  - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
  - `BETTER_AUTH_SECRET` = `${{secret(32)}}`
  - `ORIGIN` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`

Start / pre-deploy commands come from `snapshot/railway.json`.

## Development

```bash
pnpm install
pnpm smoke # builds the add-on, regenerates ./snapshot with sv@latest, builds it
```

Commit the regenerated `snapshot/` to update the template.
