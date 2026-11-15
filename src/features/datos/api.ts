import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import type { z } from 'zod';

import { env } from '@/config/env';
import client from '@/shared/client';
import { validate } from '@/shared/data/validation';
import { AppErrors, toAppError, type AppError } from '@/shared/models/app-error/app-error';

import {
	celdaSchema,
	descargaSchema,
	estanqueSchema,
	estanquesGeojsonSchema,
	exploracionSchema,
	hipotesisSchema,
	manifiestoSchema,
	metodoSchema,
	regionSchema,
	resumenSchema,
	vigenteSchema,
	type Celda,
	type Descarga,
	type Estanque,
	type Exploracion,
	type Hipotesis,
	type Manifiesto,
	type Metodo,
	type Region,
	type Resumen,
	type UmbralesExplorados
} from './esquemas';

/**
 * Data access of Mangroove. Two sources with the same contract:
 *
 *  - `api`: the public API (`VITE_API_URL`).
 *  - `respaldo`: the static backup the engine leaves on the CDN
 *    (`VITE_RESPALDO_URL`), used only when the API does not answer (RNF-08).
 *    It has no cell inspector and no hypothesis tests.
 *
 * Every function returns a `ResultAsync<T, AppError>` and validates the body.
 */

export type Origen = 'api' | 'respaldo';

/** Everything a versioned request needs: all data belongs to one version. */
export type Contexto = { region: string; version: string; origen: Origen };

export type ManifiestoCargado = { manifiesto: Manifiesto; origen: Origen };

export type OrdenEstanques = 'puntaje' | 'area' | 'distancia' | 'inundacion';
export type ClaseEstanque = '' | 'activo' | 'abandonado';

function parse<T>(schema: z.ZodType<T>) {
	return (value: unknown): ResultAsync<T, AppError> => {
		try {
			return okAsync(validate(schema, value));
		} catch (error) {
			return errAsync(
				AppErrors.parse('La respuesta del servidor no tiene la forma esperada.', error)
			);
		}
	};
}

/** The API did not answer at all (or answered 5xx): the backup may take over. */
function apiCaida(error: AppError) {
	return error.kind === 'network' || (error.kind === 'http' && error.status >= 500);
}

function leerRespaldo<T>(ruta: string, schema: z.ZodType<T>): ResultAsync<T, AppError> {
	if (!env.backupUrl) return errAsync(AppErrors.network());
	return ResultAsync.fromPromise(
		fetch(`${env.backupUrl}/${ruta}`).then(async response => {
			if (response.status === 404) throw AppErrors.notFound();
			if (!response.ok) throw AppErrors.http(response.status, 'El respaldo no respondió.');
			return (await response.json()) as unknown;
		}),
		error =>
			error instanceof TypeError ? AppErrors.network(undefined, error) : toAppError(error)
	).andThen(parse(schema));
}

const sinRespaldo = <T>(): ResultAsync<T, AppError> => errAsync(AppErrors.custom('sin-conexion'));

const versionPath = (ctx: Contexto) => ({ region: ctx.region, version: ctx.version });

/** Regions with a published version. Without API, the default region from the backup. */
export function listarRegiones(): ResultAsync<{ regiones: Region[]; origen: Origen }, AppError> {
	return client
		.GET('/regiones/')
		.andThen(({ data }) => parse(regionSchema.array())(data))
		.map(regiones => ({ regiones, origen: 'api' as Origen }))
		.orElse(error => {
			if (!apiCaida(error) || !env.backupUrl) return errAsync(error);
			return leerRespaldo(`${env.defaultRegion}/vigente.json`, vigenteSchema)
				.andThen(vigente =>
					leerRespaldo(
						`${vigente.region}/${vigente.version}/manifiesto.json`,
						manifiestoSchema
					)
				)
				.map(m => ({
					origen: 'respaldo' as Origen,
					regiones: [
						{
							codigo: m.region.codigo,
							nombre: m.region.nombre,
							bbox: m.region.bbox,
							centro: m.region.centro,
							zoom_inicial: m.region.zoom_inicial,
							version: m.version,
							publicada: m.generado
						}
					]
				}))
				.orElse(() => errAsync(error));
		});
}

export function obtenerManifiesto(
	region: string,
	version: string
): ResultAsync<ManifiestoCargado, AppError> {
	return client
		.GET('/regiones/{region}/versiones/{version}/manifest/', {
			params: { path: { region, version } }
		})
		.andThen(({ data }) => parse(manifiestoSchema)(data))
		.map(manifiesto => ({ manifiesto, origen: 'api' as Origen }))
		.orElse(error => {
			if (!apiCaida(error) || !env.backupUrl) return errAsync(error);
			return leerRespaldo(`${region}/${version}/manifiesto.json`, manifiestoSchema)
				.map(manifiesto => ({ manifiesto, origen: 'respaldo' as Origen }))
				.orElse(() => errAsync(error));
		});
}

export function obtenerCeldaPorPunto(
	ctx: Contexto,
	lon: number,
	lat: number
): ResultAsync<Celda, AppError> {
	if (ctx.origen === 'respaldo') return sinRespaldo();
	return client
		.GET('/regiones/{region}/versiones/{version}/celdas/', {
			params: { path: versionPath(ctx), query: { lon, lat } }
		})
		.andThen(({ data }) => parse(celdaSchema)(data));
}

export function obtenerCelda(ctx: Contexto, celda: string): ResultAsync<Celda, AppError> {
	if (ctx.origen === 'respaldo') return sinRespaldo();
	return client
		.GET('/regiones/{region}/versiones/{version}/celdas/{celda}/', {
			params: { path: { ...versionPath(ctx), celda } }
		})
		.andThen(({ data }) => parse(celdaSchema)(data));
}

export function obtenerResumen(ctx: Contexto): ResultAsync<Resumen, AppError> {
	if (ctx.origen === 'respaldo') {
		return leerRespaldo(`${ctx.region}/${ctx.version}/resumen.json`, resumenSchema);
	}
	return client
		.GET('/regiones/{region}/versiones/{version}/resumen/', {
			params: { path: versionPath(ctx) }
		})
		.andThen(({ data }) => parse(resumenSchema)(data));
}

const ORDENES: Record<OrdenEstanques, (a: Estanque, b: Estanque) => number> = {
	puntaje: (a, b) => (b.puntaje ?? -Infinity) - (a.puntaje ?? -Infinity),
	area: (a, b) => b.area_ha - a.area_ha,
	distancia: (a, b) => (a.dist_canal_km ?? Infinity) - (b.dist_canal_km ?? Infinity),
	inundacion: (a, b) => (b.if_vecino ?? -Infinity) - (a.if_vecino ?? -Infinity)
};

export function listarEstanques(
	ctx: Contexto,
	clase: ClaseEstanque,
	orden: OrdenEstanques
): ResultAsync<Estanque[], AppError> {
	if (ctx.origen === 'respaldo') {
		// Same filter and order the API applies, over the published GeoJSON.
		return leerRespaldo(
			`${ctx.region}/${ctx.version}/estanques.geojson`,
			estanquesGeojsonSchema
		).map(coleccion =>
			coleccion.features
				.map(f => ({ ...f.properties, geometria: f.geometry }))
				.filter(e => clase === '' || e.activo === (clase === 'activo'))
				.sort(ORDENES[orden])
		);
	}
	return client
		.GET('/regiones/{region}/versiones/{version}/estanques/', {
			params: { path: versionPath(ctx), query: { clase, orden } }
		})
		.andThen(({ data }) => parse(estanqueSchema.array())(data));
}

export function listarHipotesis(ctx: Contexto): ResultAsync<Hipotesis[], AppError> {
	if (ctx.origen === 'respaldo') return sinRespaldo();
	return client
		.GET('/regiones/{region}/versiones/{version}/hipotesis/', {
			params: { path: versionPath(ctx) }
		})
		.andThen(({ data }) => parse(hipotesisSchema.array())(data));
}

export function obtenerMetodo(ctx: Contexto): ResultAsync<Metodo, AppError> {
	if (ctx.origen === 'respaldo') {
		return leerRespaldo(`${ctx.region}/${ctx.version}/metadatos.json`, metodoSchema);
	}
	return client
		.GET('/regiones/{region}/versiones/{version}/metodo/', {
			params: { path: versionPath(ctx) }
		})
		.andThen(({ data }) => parse(metodoSchema)(data));
}

export function listarDescargas(ctx: Contexto): ResultAsync<Descarga[], AppError> {
	if (ctx.origen === 'respaldo') return sinRespaldo();
	return client
		.GET('/regiones/{region}/versiones/{version}/descargas/', {
			params: { path: versionPath(ctx) }
		})
		.andThen(({ data }) => parse(descargaSchema.array())(data));
}

/**
 * Absolute URL of a layer path of the manifest. API paths redirect (302) to
 * the PNG on the CDN; backup paths already point at the file.
 */
export function urlDeCapa(ruta: string, origen: Origen) {
	if (/^https?:\/\//.test(ruta)) return ruta;
	const base = origen === 'api' ? env.apiUrl : env.backupUrl;
	return `${base}/${ruta.replace(/^\//, '')}`;
}

/** URL of the summary as CSV (the API redirects to the file on the CDN). */
export function urlResumenCsv(ctx: Contexto) {
	return ctx.origen === 'api'
		? `${env.apiUrl}/regiones/${ctx.region}/versiones/${ctx.version}/resumen/?formato=csv`
		: `${env.backupUrl}/${ctx.region}/${ctx.version}/resumen_csv.csv`;
}

/**
 * Recomputes the disconnection with other thresholds over the same version.
 * The result is an exploration: it is not stored and never replaces the
 * published version. The API rate-limits it (429) and validates ranges (422).
 */
export function explorarUmbrales(
	ctx: Contexto,
	umbrales: UmbralesExplorados
): ResultAsync<Exploracion, AppError> {
	if (ctx.origen === 'respaldo') return sinRespaldo();
	return client
		.POST('/regiones/{region}/versiones/{version}/exploraciones/', {
			params: { path: versionPath(ctx) },
			// Thresholds left as null keep the value of the version's profile.
			body: {
				ow_hh_db: null,
				ow_hv_db: null,
				iv_hh_db: null,
				iv_ratio_db: null,
				marea_alta_m: umbrales.marea_alta_m ?? null,
				lluvia_max_mm: null,
				if_alta_desconectada: umbrales.if_alta_desconectada ?? null,
				min_fechas_alta: umbrales.min_fechas_alta ?? null,
				mayoria: null
			}
		})
		.andThen(({ data }) => parse(exploracionSchema)(data));
}
