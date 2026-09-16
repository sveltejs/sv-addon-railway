import { defineRailway, postgres, preserve, project, service } from 'railway/iac';

export default defineRailway(() => {
	const db = postgres('postgres');

	const web = service('web', {
		build: 'pnpm run build',
		preDeploy: 'pnpm run db:push --force',
		start: 'node build',
		env: {
			DATABASE_URL: db.env.DATABASE_URL,
			BETTER_AUTH_SECRET: preserve(),
			ORIGIN: preserve()
		}
	});

	return project('Svelte & Railway starter', {
		resources: [web, db]
	});
});
