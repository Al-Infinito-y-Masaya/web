#!/usr/bin/env node
/**
 * Scaffolds a CRUD feature and its list/detail pages from ./templates.
 *
 *   pnpm new:feature products              # entity "Product", route /products
 *   pnpm new:feature people --entity Person
 *   pnpm new:feature products --no-routes  # feature folder only
 *
 * Generated code uses the typed API client, so the endpoints
 * (/products, /products/{id}) and the schema (Product) must exist in
 * openapi/schema.json. Then run `pnpm generate:api`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		entity: { type: 'string' },
		'no-routes': { type: 'boolean', default: false },
		force: { type: 'boolean', default: false }
	}
});

const route = positionals[0];
if (!route || !/^[a-z][a-z0-9-]*$/.test(route)) {
	console.error(
		'Usage: pnpm new:feature <plural-kebab-name> [--entity Name] [--no-routes] [--force]'
	);
	console.error('Example: pnpm new:feature products');
	process.exit(1);
}

const pascal = s => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const singular = s =>
	s.endsWith('ies') ? `${s.slice(0, -3)}y` : s.endsWith('s') ? s.slice(0, -1) : s;

const Entity = values.entity ?? pascal(singular(route));
const entity = Entity[0].toLowerCase() + Entity.slice(1);
const label = singular(route).replace(/-/g, ' ');
const labels = route.replace(/-/g, ' ');
const Title = labels[0].toUpperCase() + labels.slice(1);

const fill = text =>
	text
		.replaceAll('__Entity__', Entity)
		.replaceAll('__entity__', entity)
		.replaceAll('__route__', route)
		.replaceAll('__labels__', labels)
		.replaceAll('__label__', label)
		.replaceAll('__Title__', Title);

function copyDir(from, to) {
	if (existsSync(to) && !values.force) {
		console.error(`✕ ${to} already exists (use --force to overwrite).`);
		process.exit(1);
	}
	mkdirSync(to, { recursive: true });
	for (const file of readdirSync(from)) {
		const target = join(to, file);
		writeFileSync(target, fill(readFileSync(join(from, file), 'utf8')));
		console.log(`  + ${target.replace(`${root}/`, '')}`);
	}
}

console.log(`Scaffolding "${route}" (entity ${Entity})`);
copyDir(join(root, 'templates/feature'), join(root, 'src/features', route));
if (!values['no-routes']) {
	copyDir(join(root, 'templates/routes'), join(root, 'src/app/routes/_app', route));
}

console.log(`
Next steps:
  1. Make sure openapi/schema.json has /${route}, /${route}/{id} and the ${Entity} schema,
     then run: pnpm generate:api
  2. Adjust src/features/${route}/schemas.ts, fields.tsx and table-view.tsx to your fields.
  3. Add a sidebar entry in src/app/navigation.ts: { label: '${Title}', icon: …, link: { to: '/${route}' } }
  4. pnpm dev (the route tree regenerates automatically)`);
