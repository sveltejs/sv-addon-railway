import { defineRailway, postgres, preserve, project, service } from 'railway/iac';

export default defineRailway(() => {
	const db = postgres('Postgres');

	const web = service('SvelteKit', {
		build: 'pnpm run build',
		preDeploy: 'pnpm run db:push --force',
		start: 'node build',
		env: {
			DATABASE_URL: db.env.DATABASE_URL,
			ORIGIN: 'https://${{RAILWAY_PUBLIC_DOMAIN}}',
			BETTER_AUTH_SECRET: preserve()
		},
		// sleeps when idle, so it fits a free plan
		deploy: {
			healthcheckPath: '/',
			sleepApplication: true
		}
	});

	return project('Svelte & Railway starter', {
		resources: [web, db]
	});
});
