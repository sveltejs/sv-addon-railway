import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	dts: true,
	// community addons must have zero runtime deps: bundle sv-utils, keep sv external (peer)
	external: ['sv'],
	noExternal: ['@sveltejs/sv-utils']
});
