<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
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
