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
		runsAfter('drizzle');
		runsAfter('sveltekitAdapter');
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

		const projectName: string =
			options.projectName || (loadPackageJson(cwd).data.name ?? 'svelte-railway-app');

		const dbImport = hasPostgres ? ', postgres' : '';
		const dbDeclaration = hasPostgres ? `\tconst db = postgres('postgres');\n\n` : '';
		const dbEnv = hasPostgres
			? `,\n\t\tenv: {\n\t\t\tDATABASE_URL: db.env.DATABASE_URL\n\t\t}`
			: '';
		const dbResource = hasPostgres ? ', db' : '';

		const railwayTs = `import { defineRailway, project, service${dbImport} } from 'railway/iac';

export default defineRailway(() => {
${dbDeclaration}\tconst web = service('web', {
		build: '${packageManager} run build',
		start: 'node build'${dbEnv}
	});

	return project('${projectName}', {
		resources: [web${dbResource}]
	});
});
`;

		sv.file('.railway/railway.ts', () => railwayTs);
	},
	nextSteps: () => [
		'railway login',
		'railway link',
		'railway config apply'
	]
});
