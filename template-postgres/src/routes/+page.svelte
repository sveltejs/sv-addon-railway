<script lang="ts">
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<svelte:head>
	<title>SvelteKit on Railway</title>
</svelte:head>

<section>
	<h1>It's live.</h1>

	<ul class="status">
		<li class:ok={!!data.railway.domain}>
			<span class="dot"></span>
			<span>Railway</span>
			<code>{data.railway.domain ?? 'running locally'}{data.railway.commit ? ` · ${data.railway.commit}` : ''}</code>
		</li>
		<li class:ok={data.database.ok} class:error={!data.database.ok}>
			<span class="dot"></span>
			<span>Postgres</span>
			<code>{data.database.detail}</code>
		</li>
		<li class:ok={data.auth.ok} class:error={!data.auth.ok}>
			<span class="dot"></span>
			<span>Better Auth</span>
			<code>{data.auth.detail}</code>
			<a href="/demo/better-auth">try it</a>
		</li>
	</ul>

	<div class="next">
		<article>
			<h2>Make it yours</h2>
			<p>Edit</p>
			<ul>
				<li><code>src/routes/+page.svelte</code></li>
				<li><code>src/routes/+page.server.ts</code></li>
			</ul>
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
