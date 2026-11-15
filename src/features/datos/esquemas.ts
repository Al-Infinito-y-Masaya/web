import { z } from 'zod';

/**
 * Runtime contract of the public Mangroove API.
 *
 * The OpenAPI schema types these responses as free-form objects, so their shape
 * is declared here, following `docs/dominio/contrato.md` and
 * `mangroove_publicacion/contrato.py` of the API. Every response is parsed with
 * these schemas before it reaches a component: a malformed payload becomes a
 * visible error instead of a wrong map.
 *
 * `null` is meaningful in this contract (see `dominio.ts`); nothing here turns
 * a `null` into a number.
 */

const lonLat = z.tuple([z.number(), z.number()]);
/** west, south, east, north */
const caja = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const CODIGOS_CLASE = ['IV', 'OW', 'NI', 'NC', 'ND'] as const;
export const claseSchema = z.enum(CODIGOS_CLASE);
export type Clase = z.infer<typeof claseSchema>;

export const nivelMareaSchema = z.enum(['alta', 'media', 'baja', 'desconocida']);
export type NivelMarea = z.infer<typeof nivelMareaSchema>;

export const regionSchema = z.object({
	codigo: z.string(),
	nombre: z.string(),
	bbox: caja,
	centro: lonLat,
	zoom_inicial: z.number(),
	version: z.string(),
	publicada: z.string().nullable().optional()
});
export type Region = z.infer<typeof regionSchema>;

export const fechaSchema = z.object({
	id: z.string(),
	fecha_hora: z.string(),
	track: z.number(),
	orbita: z.string(),
	crid: z.string().nullable().optional(),
	incidencia: z.number().nullable().optional(),
	cobertura: z.number().nullable().optional(),
	marea_m: z.number().nullable(),
	marea_nivel: nivelMareaSchema,
	lluvia_3d_mm: z.number().nullable(),
	usada_en_if_alta: z.boolean(),
	capas: z.record(z.string(), z.string())
});
export type Fecha = z.infer<typeof fechaSchema>;

export const brechaSchema = z.object({
	desde: z.string(),
	hasta: z.string(),
	motivo: z.string()
});
export type Brecha = z.infer<typeof brechaSchema>;

const entradaLeyenda = z.object({ codigo: z.string(), color: z.string() });
export type EntradaLeyenda = z.infer<typeof entradaLeyenda>;

export const umbralesSchema = z.looseObject({
	perfil: z.string(),
	version: z.number(),
	ow_hh_db: z.number().optional(),
	ow_hv_db: z.number().optional(),
	iv_hh_db: z.number().optional(),
	iv_ratio_db: z.number().optional(),
	marea_alta_m: z.number().optional(),
	marea_baja_m: z.number().optional(),
	lluvia_max_mm: z.number().optional(),
	if_alta_desconectada: z.number().optional(),
	min_fechas_alta: z.number().optional(),
	cusum_confianza: z.number().optional(),
	cusum_perdida_db: z.number().optional()
});
export type Umbrales = z.infer<typeof umbralesSchema>;

export const manifiestoSchema = z.object({
	formato: z.string(),
	version: z.string(),
	generado: z.string(),
	region: z.object({
		codigo: z.string(),
		nombre: z.string(),
		bbox: caja,
		centro: lonLat,
		zoom_inicial: z.number(),
		zona_horaria: z.string(),
		grilla: z.object({
			epsg: z.number(),
			celda_m: z.number(),
			x0: z.number(),
			y0: z.number(),
			ancho: z.number(),
			alto: z.number()
		})
	}),
	fuente: z.object({
		mision: z.string(),
		producto: z.string(),
		madurez: z.string(),
		crids: z.array(z.string())
	}),
	fechas: z.array(fechaSchema),
	brechas: z.array(brechaSchema),
	limites: caja.nullable(),
	capas: z.record(z.string(), z.string()),
	umbrales: umbralesSchema,
	leyendas: z.record(z.string(), z.array(entradaLeyenda)),
	codigo: z.string().nullable().optional(),
	exploracion: z.boolean().optional()
});
export type Manifiesto = z.infer<typeof manifiestoSchema>;

export const metricasSchema = z.object({
	if: z.number().nullable(),
	if_alta: z.number().nullable(),
	n_fechas: z.number().nullable(),
	n_fechas_alta: z.number().nullable(),
	desconectada: z.boolean().nullable(),
	datos_suficientes: z.boolean().nullable(),
	p_error: z.number().nullable(),
	if_esperada: z.number().nullable().optional()
});
export type Metricas = z.infer<typeof metricasSchema>;

export const cambioSchema = z.object({
	fecha_id: z.string(),
	confianza: z.number().nullable(),
	delta_hv_db: z.number().nullable()
});
export type Cambio = z.infer<typeof cambioSchema>;

export const puntoSerieSchema = z.object({
	fecha_id: z.string(),
	hh_db: z.number().nullable(),
	hv_db: z.number().nullable(),
	coherencia: z.number().nullable().optional(),
	clase: claseSchema
});
export type PuntoSerie = z.infer<typeof puntoSerieSchema>;

export const celdaSchema = z.object({
	id: z.string(),
	centroide: lonLat,
	pais: z.string().nullable().optional(),
	en_mascara: z.boolean(),
	metricas: metricasSchema.nullable(),
	cambio: cambioSchema.nullable(),
	serie: z.array(puntoSerieSchema)
});
export type Celda = z.infer<typeof celdaSchema>;

export const resumenPaisSchema = z.object({
	pais: z.string(),
	n_celdas: z.number().nullable().optional(),
	ha_manglar: z.number(),
	ha_desconectada: z.number(),
	ha_insuficiente: z.number(),
	ha_perdida_copa: z.number().nullable().optional(),
	ha_iv_tipica: z.number().nullable().optional(),
	ha_ow_tipica: z.number().nullable().optional(),
	ha_ni_tipica: z.number().nullable().optional()
});
export type ResumenPais = z.infer<typeof resumenPaisSchema>;

export const resumenFechaSchema = z.object({
	fecha_id: z.string(),
	pais: z.string(),
	ha_iv: z.number(),
	ha_ow: z.number(),
	ha_ni: z.number(),
	ha_nc: z.number(),
	ha_nd: z.number()
});

export const resumenSchema = z.object({
	version: z.string(),
	paises: z.array(resumenPaisSchema),
	fechas: z.array(resumenFechaSchema)
});
export type Resumen = z.infer<typeof resumenSchema>;

/** A GeoJSON linear ring: positions as `[lon, lat, ...]`. */
const anillo = z.array(z.array(z.number()).min(2));

export const geometriaSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('Polygon'), coordinates: z.array(anillo) }),
	z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(anillo)) })
]);
export type Geometria = z.infer<typeof geometriaSchema>;

export const estanqueSchema = z.object({
	codigo: z.string(),
	geometria: geometriaSchema,
	area_ha: z.number(),
	cv: z.number().nullable(),
	activo: z.boolean(),
	dist_canal_km: z.number().nullable(),
	if_vecino: z.number().nullable(),
	puntaje: z.number().nullable()
});
export type Estanque = z.infer<typeof estanqueSchema>;

/** Shape of the ponds in the static backup: a GeoJSON FeatureCollection. */
export const estanquesGeojsonSchema = z.object({
	features: z.array(
		z.object({
			geometry: geometriaSchema,
			properties: estanqueSchema.omit({ geometria: true })
		})
	)
});

export const hipotesisSchema = z.object({
	codigo: z.string(),
	prueba: z.string().nullable().optional(),
	grupo_a: z.string().nullable().optional(),
	grupo_b: z.string().nullable().optional(),
	evaluable: z.boolean(),
	motivo: z.string().nullable().optional(),
	n_a: z.number().nullable().optional(),
	n_b: z.number().nullable().optional(),
	mediana_a: z.number().nullable().optional(),
	mediana_b: z.number().nullable().optional(),
	estadistico: z.number().nullable().optional(),
	z: z.number().nullable().optional(),
	p_valor: z.number().nullable().optional(),
	efecto: z.number().nullable().optional()
});
export type Hipotesis = z.infer<typeof hipotesisSchema>;

export const metodoSchema = z.object({
	version: z.string(),
	codigo: z.string().nullable().optional(),
	madurez: z.string(),
	modelo_marea: z.string().nullable().optional(),
	fuente_lluvia: z.string().nullable().optional(),
	semilla: z.number().nullable().optional(),
	perfil: z.object({ codigo: z.string(), version: z.number() }),
	productos: z.array(
		z.object({
			fecha_id: z.string(),
			granulos: z.array(z.string()),
			crid: z.string().nullable().optional()
		})
	),
	insumos: z.array(
		z.object({
			tipo: z.string(),
			version: z.string().nullable().optional(),
			fuente: z.string().nullable().optional(),
			fuente_url: z.string().nullable().optional(),
			licencia: z.string().nullable().optional(),
			sha256: z.string().nullable().optional()
		})
	),
	creditos: z.array(z.string()),
	licencia_datos: z.string()
});
export type Metodo = z.infer<typeof metodoSchema>;

export const descargaSchema = z.object({
	tipo: z.string(),
	formato: z.string(),
	bytes: z.number(),
	sha256: z.string(),
	licencia: z.string(),
	url: z.string()
});
export type Descarga = z.infer<typeof descargaSchema>;

/** Pointer the engine leaves on the CDN: `{region}/vigente.json`. */
export const vigenteSchema = z.object({ region: z.string(), version: z.string() });

/** Thresholds a visitor may change in an exploration, with the ranges the API accepts. */
export type UmbralesExplorados = {
	if_alta_desconectada?: number;
	min_fechas_alta?: number;
	marea_alta_m?: number;
};

export const exploracionSchema = z.object({
	exploracion: z.literal(true),
	huella: z.string(),
	version: z.string(),
	capas: z.object({ desconexion: z.string() }),
	resumen: z.array(
		z.object({
			pais: z.string(),
			ha_manglar: z.number(),
			ha_desconectada: z.number(),
			ha_insuficiente: z.number()
		})
	)
});
export type Exploracion = z.infer<typeof exploracionSchema>;
