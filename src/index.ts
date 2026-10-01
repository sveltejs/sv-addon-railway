import {
	type AstTypes,
	defineEnv,
	isKit3,
	loadPackageJson,
	resolveLibPrefix,
	svelteConfig,
	transforms
} from '@sveltejs/sv-utils';
import { defineAddon, defineAddonOptions } from 'sv';
import { LAYOUT_CSS, layoutSvelte, statusPage, statusPageServer } from './style.js';

const ADAPTER_NODE = '@sveltejs/adapter-node';
// adapter-node 6 requires kit 3
const ADAPTER_NODE_VERSION = { kit2: '^5.5.4', kit3: '^6.0.0' };
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
		.add('enableStyle', {
			type: 'boolean',
			question: 'Style the app and show a deployment status page?',
			default: true
		})
		.build(),
	setup: ({ isKit, unsupported, runsAfter }) => {
		if (!isKit) unsupported('Requires SvelteKit');
		// runsAfter matches addon ids at runtime, but is typed with officialAddons keys
		runsAfter('drizzle');
		runsAfter('better-auth' as 'betterAuth');
		runsAfter('sveltekit-adapter' as 'sveltekitAdapter');
	},
	run: ({ sv, cwd, dependencyVersion, packageManager, options, language, directory }) => {
		const kitRange = dependencyVersion('@sveltejs/kit');
		const kit3 = isKit3(kitRange);

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
		sv.devDependency(ADAPTER_NODE, kit3 ? ADAPTER_NODE_VERSION.kit3 : ADAPTER_NODE_VERSION.kit2);

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
				adapterImport.source.value = ADAPTER_NODE;
				adapterImport.source.raw = undefined;
				const defaultSpecifier = adapterImport.specifiers?.find(
					(s): s is AstTypes.ImportDefaultSpecifier => s.type === 'ImportDefaultSpecifier'
				);
				adapterName = defaultSpecifier!.local.name;
			} else {
				js.imports.addDefault(ast, { from: ADAPTER_NODE, as: adapterName });
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

		const environment = defineEnv({ sv, cwd, dependencyVersion });
		const railwayVariables = [
			{
				name: 'RAILWAY_PUBLIC_DOMAIN',
				description: 'Public domain assigned by Railway, shown on the deployment status page. Optional outside Railway.'
			},
			{
				name: 'RAILWAY_GIT_COMMIT_SHA',
				description: 'Git commit SHA deployed by Railway, shown on the deployment status page. Optional outside Railway.'
			}
		];
		for (const variable of railwayVariables) environment.define(variable);

		// define() does not support schemas yet. Railway metadata is absent locally.
		if (environment.mode === 'declared') {
			sv.file(
				`src/env.${language}`,
				transforms.script(({ ast, js }) => {
					for (const node of ast.body) {
						if (node.type !== 'ExportNamedDeclaration') continue;
						if (node.declaration?.type !== 'VariableDeclaration') continue;
						const variable = node.declaration.declarations.find(
							(d) => d.id.type === 'Identifier' && d.id.name === 'variables'
						);
						const values = variable?.init;
						if (values?.type !== 'CallExpression') continue;
						const definitions = values.arguments[0];
						if (definitions?.type !== 'ObjectExpression') continue;
						for (const { name } of railwayVariables) {
							const entry = js.object.property(definitions, {
								name,
								fallback: js.object.create({})
							});
							if (entry.type !== 'ObjectExpression') continue;
							js.object.property(entry, {
								name: 'schema',
								fallback: js.common.parseExpression('(value) => value')
							});
						}
					}
				})
			);
		}

		const projectName: string =
			options.projectName || (loadPackageJson(cwd).data.name ?? 'svelte-railway-app');

		const imports = ['defineRailway'];
		if (hasPostgres) imports.push('postgres');
		if (hasBetterAuth) imports.push('preserve');
		imports.push('project', 'service');

		const envEntries: string[] = [];
		if (hasPostgres) envEntries.push('DATABASE_URL: db.env.DATABASE_URL');
		// adapter-node 5 and better-auth read ORIGIN at runtime; Railway resolves the ${{...}} reference.
		// adapter-node 6 defaults to https + Host header, so a build-time `paths.origin` isn't needed
		// (and would pin the app to the Railway domain, breaking custom domains)
		if (!kit3 || hasBetterAuth) envEntries.push("ORIGIN: 'https://${{RAILWAY_PUBLIC_DOMAIN}}'");
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

		if (options.enableStyle) {
			const routes = directory.kitRoutes;
			sv.file(`${routes}/layout.css`, () => LAYOUT_CSS);

			sv.file(`${routes}/+layout.svelte`, (content) =>
				content.includes('./layout.css')
					? content
					: layoutSvelte({ language, hasFavicon: content.includes('favicon') })
			);

			// only the scaffolded landing page is ours to replace
			sv.file(`${routes}/+page.svelte`, (content) =>
				content.includes('Welcome to SvelteKit') || content.trim() === ''
					? statusPage({ language, hasPostgres, hasBetterAuth })
					: content
			);
			if (hasPostgres) {
				sv.file(`${routes}/+page.server.${language}`, (content) =>
					content.trim() === ''
						? statusPageServer({
								hasBetterAuth,
								lib: resolveLibPrefix(kitRange),
								language,
								declaredEnv: environment.mode === 'declared'
							})
						: content
				);
			}
		}
	},
	nextSteps: ({ dependencyVersion }) => {
		const steps = ['railway login', 'railway link', 'railway config apply'];
		if (dependencyVersion('better-auth')) {
			steps.push('Set BETTER_AUTH_SECRET on the SvelteKit service in Railway');
		}
		return steps;
	}
});
