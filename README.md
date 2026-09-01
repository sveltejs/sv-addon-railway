# sv-addon-railway

Community [Svelte CLI](https://svelte.dev/docs/cli) add-on that writes Railway
[Infrastructure as Code](https://docs.railway.com/infrastructure-as-code) (`.railway/railway.ts`)
based on the other add-ons you selected.

```bash
npx sv create my-app --add drizzle better-auth sv-addon-railway
cd my-app
railway login && railway link && railway config apply
```

What it does:

- writes `.railway/railway.ts` (a `web` service, plus a `postgres` database with `DATABASE_URL` wiring when drizzle + postgres are detected)
- switches the app to `@sveltejs/adapter-node`
- adds the `railway` package for the `railway/iac` types

## Options

| option        | default          | description                     |
| ------------- | ---------------- | ------------------------------- |
| `projectName` | the package name | Railway project name            |

```bash
npx sv add sv-addon-railway="projectName:My app"
```

## Development

```bash
pnpm install
pnpm smoke # builds, then scaffolds ./snapshot with drizzle + better-auth + this addon
```

`snapshot/` is the generated reference app ("Svelte & Railway starter") - the same output is
meant to be pushed to [kit-template-railway](https://github.com/sveltejs/kit-template-railway).
