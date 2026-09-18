/** Palette and shell of the `sv` demo template, without its fonts and images. */
export const LAYOUT_CSS = `:root {
	--font-body:
		-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
		'Helvetica Neue', Arial, sans-serif;
	--font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
	--color-bg-0: rgb(202, 216, 228);
	--color-bg-1: hsl(209, 36%, 86%);
	--color-bg-2: hsl(224, 44%, 95%);
	--color-theme-1: #ff3e00;
	--color-theme-2: #4075a6;
	--color-text: rgba(0, 0, 0, 0.7);
	--color-ok: #0f7b4f;
	--color-error: #b3261e;
	font-family: var(--font-body);
	color: var(--color-text);
}

body {
	min-height: 100vh;
	margin: 0;
	background-attachment: fixed;
	background-color: var(--color-bg-1);
	background-size: 100vw 100vh;
	background-image:
		radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 100%),
		linear-gradient(180deg, var(--color-bg-0) 0%, var(--color-bg-1) 15%, var(--color-bg-2) 50%);
}

h1,
h2,
p {
	font-weight: 400;
}

h1 {
	font-size: 2rem;
}

h2 {
	font-size: 1rem;
}

p {
	line-height: 1.5;
}

a {
	color: var(--color-theme-1);
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

code {
	font-family: var(--font-mono);
	font-size: 0.9em;
	background: rgba(255, 255, 255, 0.55);
	border-radius: 3px;
	padding: 0.1em 0.35em;
}

input,
button {
	font-size: inherit;
	font-family: inherit;
}

label {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	font-size: 0.9rem;
	/* one field per row, so sibling buttons share the last one */
	flex: 1 0 100%;
}

input {
	padding: 0.5rem 0.65rem;
	border: 1px solid rgba(0, 0, 0, 0.15);
	border-radius: 6px;
	background: white;
}

input:focus-visible {
	outline: 2px solid var(--color-theme-2);
	outline-offset: 1px;
}

button {
	align-self: flex-start;
	padding: 0.5rem 1rem;
	border: none;
	border-radius: 6px;
	background: var(--color-theme-1);
	color: white;
	cursor: pointer;
}

button:hover {
	background: #e63800;
}

form {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	max-width: 22rem;
}
`;

export function layoutSvelte(options: { language: 'ts' | 'js'; hasFavicon: boolean }): string {
	const lang = options.language === 'ts' ? ' lang="ts"' : '';
	const favicon = options.hasFavicon
		? "\timport favicon from '$lib/assets/favicon.svg';\n"
		: '';
	const faviconHead = options.hasFavicon
		? '<svelte:head>\n\t<link rel="icon" href={favicon} />\n</svelte:head>\n\n'
		: '';
	return `<script${lang}>
${favicon}	import './layout.css';

	let { children } = $props();
</script>

${faviconHead}<div class="app">
	<header>
		<a class="brand" href="/">SvelteKit <span>on Railway</span></a>
		<a class="deploy" href="https://railway.com/deploy/svelte-kit" target="_blank" rel="noreferrer">
			New project
		</a>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<p>
			deployed with <a href="https://svelte.dev/docs/kit">SvelteKit</a> on
			<a href="https://railway.com">Railway</a>
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		max-width: 48rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.brand {
		color: var(--color-text);
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
	}

	.brand span {
		color: var(--color-theme-1);
	}

	.deploy {
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
	}

	main {
		flex: 1;
		width: 100%;
		max-width: 48rem;
		margin: 0 auto;
		padding: 1rem;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		justify-content: center;
		padding: 1rem;
		font-size: 0.9rem;
	}
</style>
`;
}

/** Proves the deploy wired itself up: database reachable, schema pushed, domain known. */
export function statusPageServer(hasBetterAuth: boolean): string {
	const authImport = hasBetterAuth ? "import { user } from '$lib/server/db/auth.schema';\n" : '';
	const auth = hasBetterAuth
		? `
	let auth;
	try {
		const count = await db.$count(user);
		auth = { ok: true, detail: count === 1 ? '1 account' : \`\${count} accounts\` };
	} catch {
		auth = { ok: false, detail: 'schema not pushed' };
	}
`
		: '';
	const authReturn = hasBetterAuth ? '\n\t\tauth,' : '';

	return `import { env } from '$env/dynamic/private';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
${authImport}
export const load = async () => {
	let database;
	try {
		const rows = await db.execute(sql\`select version()\`);
		const version = String(Object.values(rows[0] ?? {})[0] ?? '');
		database = { ok: true, detail: version.split(' ').slice(0, 2).join(' ') };
	} catch (error) {
		database = { ok: false, detail: error instanceof Error ? error.message : 'unreachable' };
	}
${auth}
	return {
		database,${authReturn}
		railway: {
			domain: env.RAILWAY_PUBLIC_DOMAIN ?? null,
			commit: env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? null
		}
	};
};
`;
}

export function statusPage(options: {
	language: 'ts' | 'js';
	hasPostgres: boolean;
	hasBetterAuth: boolean;
}): string {
	const lang = options.language === 'ts' ? ' lang="ts"' : '';
	const props = options.hasPostgres
		? options.language === 'ts'
			? "\timport type { PageServerData } from './$types';\n\n\tlet { data }: { data: PageServerData } = $props();\n"
			: '\tlet { data } = $props();\n'
		: '';
	const script = props ? `<script${lang}>\n${props}</script>\n\n` : '';

	const authRow = options.hasBetterAuth
		? `		<li class:ok={data.auth.ok} class:error={!data.auth.ok}>
			<span class="dot"></span>
			<span>Better Auth</span>
			<code>{data.auth.detail}</code>
			<a href="/demo/better-auth">try it</a>
		</li>
`
		: '';
	const serverFile = options.hasPostgres
		? `			<li><code>src/routes/+page.server.${options.language}</code></li>\n`
		: '';
	const rows = options.hasPostgres
		? `		<li class:ok={!!data.railway.domain}>
			<span class="dot"></span>
			<span>Railway</span>
			<code>{data.railway.domain ?? 'running locally'}{data.railway.commit ? \` · \${data.railway.commit}\` : ''}</code>
		</li>
		<li class:ok={data.database.ok} class:error={!data.database.ok}>
			<span class="dot"></span>
			<span>Postgres</span>
			<code>{data.database.detail}</code>
		</li>
${authRow}`
		: '';

	return `${script}<svelte:head>
	<title>SvelteKit on Railway</title>
</svelte:head>

<section>
	<h1>It's live.</h1>

	<ul class="status">
${rows}	</ul>

	<div class="next">
		<article>
			<h2>Make it yours</h2>
			<p>Edit</p>
			<ul>
				<li><code>src/routes/+page.svelte</code></li>
	${serverFile}			</ul>
		</article>
		<article>
			<h2>Drop the styling</h2>
			<p>Delete</p>
			<ul>
				<li><code>src/routes/layout.css</code></li>
				<li><code>src/routes/+layout.svelte</code></li>
			</ul>
		</article>
	</div>
</section>

<style>
	h1 {
		margin-bottom: 0.5rem;
	}

	.status {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.status li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(255, 255, 255, 0.55);
		border-radius: 8px;
		padding: 0.6rem 0.8rem;
		font-size: 0.95rem;
	}

	.status li span:nth-of-type(2) {
		font-weight: 700;
		min-width: 6rem;
	}

	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--color-text);
	}

	.ok .dot {
		background: var(--color-ok);
	}

	.error .dot {
		background: var(--color-error);
	}

	.status li a {
		margin-left: auto;
		font-weight: 700;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.next {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		margin-top: 2.5rem;
	}

	.next article {
		border: 1px dashed rgba(0, 0, 0, 0.18);
		border-radius: 8px;
		padding: 0.8rem 1rem;
	}

	.next h2 {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-theme-2);
	}

	.next p {
		margin: 0;
		font-size: 0.85rem;
	}

	.next ul {
		margin: 0.4rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.85rem;
	}

	.next li {
		margin-bottom: 0.2rem;
	}
</style>
`;
}
