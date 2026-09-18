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
- writes `.railway/railway.ts` ([Infrastructure as Code](https://docs.railway.com/infrastructure-as-code), applied by `railway config apply`): a `SvelteKit` service that sleeps when idle, plus a `Postgres` database with `DATABASE_URL` wiring and a `db:push` pre-deploy when drizzle + postgres are detected
- adds the `railway` package for the `railway/iac` types

`adapter-node` needs `ORIGIN` to build absolute URLs behind Railway's proxy, so the service sets
it to `https://${{RAILWAY_PUBLIC_DOMAIN}}` - the domain Railway assigns, resolved on their side.
Secrets like `BETTER_AUTH_SECRET` use `preserve()`: the value you set in Railway stays, and never
lands in the repo.

[`railway.json`](https://docs.railway.com/config-as-code) is deliberately not written: it stops
working at the end of the year, and deploys that ignore the IaC file (GitHub or template deploys)
get their config from the template instead.

## Options

| option        | default          | description          |
| ------------- | ---------------- | -------------------- |
| `projectName` | the package name | Railway project name |

```bash
npx sv add sv-addon-railway="projectName:My app"
```

## Template

`template-postgres/` is the generated reference app ("Svelte & Railway starter": drizzle + better-auth + this add-on).
It backs the [svelte-kit template](https://railway.com/deploy/svelte-kit) on Railway.

Template config (set in the Railway template composer, since a template deploy never runs
`.railway/railway.ts` - it must mirror that file):

- source: `sveltejs/sv-addon-railway`, root directory `/template-postgres`
- a `Postgres` database service
- on the `SvelteKit` service:
  - start command `node build`
  - pre-deploy command `pnpm run db:push --force`
  - serverless (app sleeping) enabled, healthcheck path `/`
  - variables: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `ORIGIN` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`, `BETTER_AUTH_SECRET` = `${{secret(32)}}`


## Development

```bash
pnpm install
pnpm smoke # builds the add-on, regenerates ./template-postgres with sv@latest, builds it
```

Commit the regenerated `template-postgres/` to update the template.
