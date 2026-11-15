import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import {
	assetUrl,
	blockSchema,
	catalogSchema,
	cellAt,
	manifestSchema,
	qualitySchema
} from '../src/features/experimental/data.ts';

// node scripts/experimental-package.mjs DATA_ROOT NEW_PACKAGE_DIR RELEASE ENGINE_COMMIT
const [source, destination, release, engineCommit] = process.argv.slice(2);
if (!source || !destination || !/^[a-zA-Z0-9-]+$/.test(release ?? '') || !engineCommit)
	throw new Error('Expected DATA_ROOT NEW_PACKAGE_DIR RELEASE ENGINE_COMMIT');
const dataRoot = path.resolve(source),
	out = path.resolve(destination);
if (fs.existsSync(out))
	throw new Error('Package destination already exists; choose a new empty path.');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const catalog = catalogSchema.parse(read(path.join(dataRoot, 'vigente.json')));
let cells = 0;
for (const site of catalog.sitios) {
	const manifestFile = path.resolve(dataRoot, site.manifest);
	if (!manifestFile.startsWith(dataRoot + path.sep))
		throw new Error('Manifest escaped data root');
	const root = path.dirname(manifestFile),
		m = manifestSchema.parse(read(manifestFile));
	const q = qualitySchema.parse(read(path.join(root, m.datos.calidad)));
	if (q.config_sha256 !== m.motor.config_sha256 || q.n_fechas !== m.fechas.length)
		throw new Error('Quality mismatch');
	const ids = m.fechas.map(d => d.fecha_id);
	for (const relative of [
		...Object.values(m.capas.rgb),
		...Object.values(m.capas.clases),
		m.capas.conectividad,
		m.datos.calidad,
		m.datos.resumen
	]) {
		assetUrl(relative, 'https://example.org/release/manifest.json');
		if (!fs.statSync(path.join(root, relative)).isFile()) throw new Error('Missing asset');
	}
	if (ids.some(id => !m.capas.clases[id] || !m.capas.rgb[id]))
		throw new Error('Missing acquisition');
	for (const entry of m.bloques) {
		assetUrl(entry.archivo, 'https://example.org/release/manifest.json');
		const b = blockSchema.parse(read(path.join(root, entry.archivo)));
		if (b.bloque !== entry.bloque || b.celdas.length !== entry.n_celdas)
			throw new Error('Block mismatch');
		for (const c of b.celdas) {
			const found = cellAt(m, ...c.centroide);
			if (
				found?.id !== c.id ||
				found.bloque !== b.bloque ||
				JSON.stringify(c.serie.map(p => p.fecha_id)) !== JSON.stringify(ids)
			)
				throw new Error(`Cell mapping mismatch ${c.id}`);
			cells++;
		}
	}
}
fs.mkdirSync(out, { recursive: true });
fs.cpSync(dataRoot, path.join(out, 'data'), { recursive: true });
fs.cpSync('dist-experimental', path.join(out, 'app'), { recursive: true });
if (!fs.existsSync(path.join(out, 'app/index.html'))) throw new Error('Build has no index');
fs.mkdirSync(path.join(out, 'schemas'));
for (const [name, schema] of Object.entries({
	catalog: catalogSchema,
	manifest: manifestSchema,
	block: blockSchema,
	quality: qualitySchema
})) {
	fs.writeFileSync(
		path.join(out, 'schemas', `${name}.schema.json`),
		JSON.stringify(z.toJSONSchema(schema, { io: 'input' }), null, 2)
	);
}
const hashes = {};
function inventory(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const file = path.join(dir, entry.name);
		if (entry.isDirectory()) inventory(file);
		else
			hashes[path.relative(out, file).split(path.sep).join('/')] = createHash('sha256')
				.update(fs.readFileSync(file))
				.digest('hex');
	}
}
inventory(out);
const metadata = {
	release,
	engineCommit,
	frontendCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	createdUtc: new Date().toISOString(),
	validatedCells: cells,
	hashes
};
fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify(metadata, null, 2));
console.log(
	JSON.stringify({
		release,
		files: Object.keys(hashes).length,
		validatedCells: cells,
		destination: out
	})
);
