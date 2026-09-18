import { type AstTypes, loadPackageJson, svelteConfig, transforms } from '@sveltejs/sv-utils';
import { defineAddon, defineAddonOptions } from 'sv';

const ADAPTER_NODE = { package: '@sveltejs/adapter-node', version: '^5.5.4' };
const RAILWAY_VERSION = '^3.11.0';

export default defineAddon({
	id: 'railway',
	shortDescription: 'Railway IaC',
	homepage: 'https://docs.railway.com/infrastructure-as-code',
	options: defineAddonOptions()
		.add('projectName', {
			type: 'string',
			question: 'What should the Railway project be called?',
			default: '',
			placeholder: 'defaults to the package name',
			required: false
		})
		.build(),
	setup: ({ isKit, unsupported, runsAfter }) => {
		if (!isKit) unsupported('Requires SvelteKit');
		// runsAfter matches addon ids at runtime, but is typed with officialAddons keys
		runsAfter('drizzle');
		runsAfter('better-auth' as 'betterAuth');
		runsAfter('sveltekit-adapter' as 'sveltekitAdapter');
	},
	run: ({ sv, cwd, dependencyVersion, packageManager, options }) => {
		// Railway runs a node server: force adapter-node
		sv.file(
			'package.json',
			transforms.json(({ data }) => {
				const devDeps = data['devDependencies'] ?? {};
				for (const pkg of Object.keys(devDeps)) {
					if (pkg.startsWith('@sveltejs/adapter-')) delete devDeps[pkg];
				}
				// Railpack needs a start script to detect the entrypoint
				data['scripts'] ??= {};
				data['scripts']['start'] = 'node build';
			})
		);
		sv.devDependency(ADAPTER_NODE.package, ADAPTER_NODE.version);

		svelteConfig.edit({ sv, cwd }, ({ ast, override, js }) => {
			const imports = ast.body.filter(
				(n): n is AstTypes.ImportDeclaration => n.type === 'ImportDeclaration'
			);
			const adapterImport = imports.find(
				(i) =>
					typeof i.source.value === 'string' &&
					i.source.value.startsWith('@sveltejs/adapter-') &&
					i.importKind === 'value'
			);

			let adapterName = 'adapter';
			if (adapterImport) {
				adapterImport.source.value = ADAPTER_NODE.package;
				adapterImport.source.raw = undefined;
				const defaultSpecifier = adapterImport.specifiers?.find(
					(s): s is AstTypes.ImportDefaultSpecifier => s.type === 'ImportDefaultSpecifier'
				);
				adapterName = defaultSpecifier!.local.name;
			} else {
				js.imports.addDefault(ast, { from: ADAPTER_NODE.package, as: adapterName });
			}

			override(
				{ adapter: js.functions.createCall({ name: adapterName, args: [], useIdentifiers: true }) },
				{ dropLeadingComments: ['adapter'] }
			);
		});

		// `railway` package provides the `railway/iac` types
		sv.devDependency('railway', RAILWAY_VERSION);

		const hasPostgres =
			!!dependencyVersion('drizzle-orm') &&
			(!!dependencyVersion('postgres') || !!dependencyVersion('pg'));
		const hasBetterAuth = !!dependencyVersion('better-auth');

		const projectName: string =
			options.projectName || (loadPackageJson(cwd).data.name ?? 'svelte-railway-app');

		const imports = ['defineRailway'];
		if (hasPostgres) imports.push('postgres');
		if (hasBetterAuth) imports.push('preserve');
		imports.push('project', 'service');

		const envEntries: string[] = [];
		if (hasPostgres) envEntries.push('DATABASE_URL: db.env.DATABASE_URL');
		// adapter-node needs ORIGIN to trust the proxy; Railway resolves the ${{...}} reference
		envEntries.push("ORIGIN: 'https://${{RAILWAY_PUBLIC_DOMAIN}}'");
		// secrets stay out of the committed file: preserve() keeps the value set in Railway
		if (hasBetterAuth) envEntries.push('BETTER_AUTH_SECRET: preserve()');

		const dbDeclaration = hasPostgres ? `\tconst db = postgres('Postgres');\n\n` : '';
		// --force: strict drizzle config prompts for confirmation, there is no TTY on deploy
		const preDeploy = hasPostgres ? `\n\t\tpreDeploy: '${packageManager} run db:push --force',` : '';
		const env = envEntries.length
			? `\n\t\tenv: {\n${envEntries.map((e) => `\t\t\t${e}`).join(',\n')}\n\t\t},`
			: '';
		const dbResource = hasPostgres ? ', db' : '';

		const railwayTs = `import { ${imports.join(', ')} } from 'railway/iac';

export default defineRailway(() => {
${dbDeclaration}\tconst web = service('SvelteKit', {
		build: '${packageManager} run build',${preDeploy}
		start: 'node build',${env}
		// sleeps when idle, so it fits a free plan
		deploy: {
			healthcheckPath: '/',
			sleepApplication: true
		}
	});

	return project('${projectName}', {
		resources: [web${dbResource}]
	});
});
`;

		sv.file('.railway/railway.ts', () => railwayTs);
	},
	nextSteps: ({ dependencyVersion }) => {
		const steps = ['railway login', 'railway link', 'railway config apply'];
		if (dependencyVersion('better-auth')) {
			steps.push('Set BETTER_AUTH_SECRET on the SvelteKit service in Railway');
		}
		return steps;
	}
});
