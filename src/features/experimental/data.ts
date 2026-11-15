import proj4 from 'proj4';
import { z } from 'zod';

const finite = z.number().finite();
const nullable = finite.nullable();
const fraction = finite.min(0).max(1).nullable();
const point = z.tuple([finite, finite]);
const dateId = z.string().regex(/^\d{4}-\d{2}-\d{2}_(asc|desc)$/);
const state = z.enum(['conectada', 'seca', 'estancada', 'datos_insuficientes']);
export const catalogSchema = z.object({
	version: z.literal('1'),
	sitios: z
		.array(
			z.object({
				id: z.enum(['aserradores', 'padre_ramos', 'chismuyo']),
				nombre: z.string(),
				publicacion: z.string(),
				contrato: z.literal('0.2.0'),
				manifest: z.string()
			})
		)
		.min(1)
});
export type Site = z.infer<typeof catalogSchema>['sitios'][number];
export const manifestSchema = z.object({
	version: z.literal('0.2.0'),
	motor: z.object({
		version: z.string(),
		config_sha256: z.string(),
		semilla: z.number(),
		crid: z.array(z.string())
	}),
	region: z.object({
		nombre: z.string(),
		bbox: z.tuple([finite, finite, finite, finite]),
		centro: point
	}),
	grilla: z.object({
		epsg: z.literal(32616),
		x0: finite,
		y0: finite,
		celda_m: finite.positive(),
		ancho: z.number().int().positive(),
		alto: z.number().int().positive(),
		bloque_celdas: z.number().int().positive()
	}),
	fechas: z
		.array(
			z.object({
				fecha_id: dateId,
				fecha: z.string(),
				hora_utc: z.string(),
				direccion: z.enum(['asc', 'desc']),
				pista: z.number(),
				crid: z.string(),
				marea_m: finite,
				marea_nivel: z.enum(['alta', 'media', 'baja']),
				sospechosa: z.boolean()
			})
		)
		.min(1),
	marea: z.object({
		cobertura: finite,
		pleamar_rel: finite,
		modelo: z.string(),
		punto: point,
		desfase_min: finite.optional()
	}),
	calidad: z.object({
		exactitud: nullable,
		r_marea: nullable,
		p_marea: fraction.optional(),
		prueba_marea_aprobada: z.boolean().optional(),
		advertencias: z.array(z.string())
	}),
	capas: z.object({
		rgb: z.record(z.string(), z.string()),
		clases: z.record(z.string(), z.string()),
		conectividad: z.string(),
		colores_clases: z.record(z.string(), z.string()).optional()
	}),
	bloques: z.array(
		z.object({ bloque: z.string(), archivo: z.string(), n_celdas: z.number().int() })
	),
	datos: z.object({ resumen: z.string(), calidad: z.string() })
});
export type Manifest = z.infer<typeof manifestSchema>;
export const cellSchema = z.object({
	id: z.string().regex(/^c_\d{6}$/),
	centroide: point,
	pais: z.string(),
	estrato: z.enum(['bajo', 'alto']).nullable(),
	en_mascara: z.boolean(),
	metricas: z
		.object({
			if: fraction,
			if_alta: fraction,
			if_baja: fraction,
			n_fechas: z.number().int(),
			n_fechas_alta: z.number().int(),
			n_fechas_baja: z.number().int(),
			estado: state,
			p_error: fraction,
			sens_db_m: nullable,
			sens_p: fraction
		})
		.nullable(),
	cambio: z.object({ fecha_id: dateId, confianza: finite, delta_hv_db: finite }).nullable(),
	serie: z.array(
		z.object({
			fecha_id: dateId,
			hh_db: nullable,
			hv_db: nullable,
			coherencia: nullable,
			clase: z.enum(['IV', 'OW', 'NI', 'NC']).nullable()
		})
	)
});
export type Cell = z.infer<typeof cellSchema>;
export const blockSchema = z.object({
	version: z.literal('0.2.0'),
	bloque: z.string(),
	celdas: z.array(cellSchema)
});
const correlation = z.object({
	n: z.number(),
	evaluable: z.boolean(),
	r: nullable,
	p: fraction,
	aprobada: z.boolean()
});
export const qualitySchema = z.object({
	contrato: z.literal('0.2.0'),
	config_sha256: z.string(),
	n_fechas: z.number(),
	prueba_marea: z.object({
		clases: correlation,
		senal_hh: correlation,
		clases_por_pila: z.record(z.string(), correlation)
	}),
	clases_fijas: z.object({
		agua_permanente_ow: z.object({ acierto: fraction, aprobada: z.boolean() }),
		tierra_firme_no_iv: z.object({ acierto: fraction, aprobada: z.boolean() })
	}),
	muestras_opticas: z.unknown().nullable(),
	advertencias: z.array(z.string())
});
export type Quality = z.infer<typeof qualitySchema>;
export type Dataset = { site: Site; manifest: Manifest; quality: Quality; manifestUrl: string };

export function assetUrl(relative: string, manifestUrl: string) {
	const base = new URL('.', manifestUrl);
	const url = new URL(relative, base);
	if (
		url.origin !== base.origin ||
		!url.pathname.startsWith(base.pathname) ||
		url.username ||
		url.password
	)
		throw new Error('El paquete contiene una ruta fuera de su publicación.');
	return url.href;
}
export async function readJson<T>(
	url: string,
	schema: z.ZodType<T>,
	signal?: AbortSignal
): Promise<T> {
	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error(`No se pudo cargar el archivo (HTTP ${response.status}).`);
	const result = schema.safeParse(await response.json());
	if (!result.success) throw new Error('El archivo no cumple el contrato experimental.');
	return result.data;
}
export async function loadDataset(
	site: Site,
	catalogUrl: string,
	signal?: AbortSignal
): Promise<Dataset> {
	const manifestUrl = new URL(site.manifest, catalogUrl).href;
	if (new URL(manifestUrl).origin !== new URL(catalogUrl).origin)
		throw new Error('La publicación pertenece a otro origen.');
	const manifest = await readJson(manifestUrl, manifestSchema, signal);
	const quality = await readJson(
		assetUrl(manifest.datos.calidad, manifestUrl),
		qualitySchema,
		signal
	);
	if (
		quality.config_sha256 !== manifest.motor.config_sha256 ||
		quality.n_fechas !== manifest.fechas.length
	)
		throw new Error('El informe de calidad no corresponde a esta publicación.');
	const ids = manifest.fechas.map(d => d.fecha_id);
	if (
		new Set(ids).size !== ids.length ||
		ids.some(id => !manifest.capas.rgb[id] || !manifest.capas.clases[id])
	)
		throw new Error('Faltan capas o hay adquisiciones duplicadas.');
	return { site, manifest, quality, manifestUrl };
}
proj4.defs('EPSG:32616', '+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs');
export function cellAt(manifest: Manifest, lon: number, lat: number) {
	const [x, y] = proj4('EPSG:4326', 'EPSG:32616', [lon, lat]);
	const g = manifest.grilla;
	const col = Math.floor((x! - g.x0) / g.celda_m),
		row = Math.floor((g.y0 - y!) / g.celda_m);
	if (col < 0 || row < 0 || col >= g.ancho || row >= g.alto) return null;
	return {
		id: `c_${String(row * g.ancho + col + 1).padStart(6, '0')}`,
		bloque: `b_${String(Math.floor(row / g.bloque_celdas)).padStart(2, '0')}_${String(Math.floor(col / g.bloque_celdas)).padStart(2, '0')}`
	};
}
// The full manifest URL contains site and immutable publication identity.
const blocks = new Map<string, Promise<z.infer<typeof blockSchema>>>();
export async function loadCell(dataset: Dataset, lon: number, lat: number): Promise<Cell | null> {
	const found = cellAt(dataset.manifest, lon, lat);
	if (!found) return null;
	const entry = dataset.manifest.bloques.find(b => b.bloque === found.bloque);
	if (!entry) throw new Error('No se encontró el bloque de esta celda.');
	const url = assetUrl(entry.archivo, dataset.manifestUrl);
	let task = blocks.get(url);
	if (!task) {
		task = readJson(url, blockSchema).catch(e => {
			blocks.delete(url);
			throw e;
		});
		blocks.set(url, task);
	}
	const block = await task;
	if (block.bloque !== found.bloque) throw new Error('El bloque no corresponde a la celda.');
	const cell = block.celdas.find(c => c.id === found.id);
	if (!cell) throw new Error('La celda no está en el bloque.');
	if (
		cell.serie.length !== dataset.manifest.fechas.length ||
		cell.serie.some((p, i) => p.fecha_id !== dataset.manifest.fechas[i]?.fecha_id)
	)
		throw new Error('La serie no corresponde a las fechas de la publicación.');
	return cell;
}
export function formatP(value: number | null) {
	return value === null
		? 'Sin estimación'
		: value === 0
			? '< 0,0001'
			: value.toLocaleString('es-NI', { maximumFractionDigits: 4, minimumFractionDigits: 4 });
}
export function percent(value: number | null) {
	return value === null
		? 'Sin dato'
		: `${(value * 100).toLocaleString('es-NI', { maximumFractionDigits: 2 })} %`;
}
export const stateLabels = {
	conectada: 'Respuesta compatible con conexión',
	seca: 'Baja frecuencia de inundación observada',
	estancada: 'Inundación persistente observada',
	datos_insuficientes: 'Datos insuficientes'
};
