import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';

function buildOnly(value) {
	if (!value && building) throw new Error('Missing required build-time environment variable');
	return value;
}

function optional(value) {
  return value;
}

export const variables = defineEnvVars({
	BETTER_AUTH_SECRET: {
		schema: buildOnly
	},
	DATABASE_URL: {
		schema: buildOnly
	},
	ORIGIN: {
		schema: buildOnly
	},
	RAILWAY_PUBLIC_DOMAIN: {
		schema: optional
	},
	RAILWAY_GIT_COMMIT_SHA: {
		schema: optional
	}
});
