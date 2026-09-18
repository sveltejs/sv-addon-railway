import { env } from '$env/dynamic/private';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';

export const load = async () => {
	let database;
	try {
		const rows = await db.execute(sql`select version()`);
		const version = String(Object.values(rows[0] ?? {})[0] ?? '');
		database = { ok: true, detail: version.split(' ').slice(0, 2).join(' ') };
	} catch (error) {
		database = { ok: false, detail: error instanceof Error ? error.message : 'unreachable' };
	}

	let auth;
	try {
		const count = await db.$count(user);
		auth = { ok: true, detail: count === 1 ? '1 account' : `${count} accounts` };
	} catch {
		auth = { ok: false, detail: 'schema not pushed' };
	}

	return {
		database,
		auth,
		railway: {
			domain: env.RAILWAY_PUBLIC_DOMAIN ?? null,
			commit: env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null
		}
	};
};
