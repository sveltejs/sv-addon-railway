import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	RAILWAY_PUBLIC_DOMAIN: {
		description: 'Public domain assigned by Railway, shown on the deployment status page. Optional outside Railway.',
		schema: (value) => value
	},
	RAILWAY_GIT_COMMIT_SHA: {
		description: 'Git commit SHA deployed by Railway, shown on the deployment status page. Optional outside Railway.',
		schema: (value) => value
	}
});
