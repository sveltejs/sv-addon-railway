import { defineRailway, project, service, postgres } from 'railway/iac';

export default defineRailway(() => {
	const db = postgres('postgres');

	const web = service('web', {
		build: 'pnpm run build',
		start: 'node build',
		env: {
			DATABASE_URL: db.env.DATABASE_URL
		}
	});

	return project('Svelte & Railway starter', {
		resources: [web, db]
	});
});
