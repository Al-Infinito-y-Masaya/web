import type { Celda, Fecha, Manifiesto, PuntoSerie } from './esquemas';

/**
 * Domain rules of the contract, in one place and free of UI.
 *
 * The rule behind most of them: `null` is an answer, not a missing zero.
 *  - `metricas: null`  → the cell is outside the mangrove mask.
 *  - `if_alta: null`   → not enough high-tide passes to say anything.
 *  - `cambio: null`    → no significant change.
 *  - `marea_m: null`   → no tide estimate for that pass.
 */

export type EstadoCelda = 'fuera' | 'insuficiente' | 'desconectada' | 'conectada';

export function estadoDeCelda(celda: Celda): EstadoCelda {
	const m = celda.metricas;
	if (!celda.en_mascara || m === null) return 'fuera';
	if (m.datos_suficientes === false || m.if_alta === null) return 'insuficiente';
	return m.desconectada ? 'desconectada' : 'conectada';
}

export type PuntoConFecha = PuntoSerie & { fecha: Fecha | undefined };

/**
 * Joins the series of a cell with the passes of the manifest by `fecha_id`.
 * The tide lives in the manifest, never in the cell. A point whose pass is not
 * in the manifest keeps `fecha: undefined` instead of borrowing a neighbour.
 */
export function unirSerie(celda: Celda, fechas: readonly Fecha[]): PuntoConFecha[] {
	const porId = new Map(fechas.map(f => [f.id, f]));
	return celda.serie.map(punto => ({ ...punto, fecha: porId.get(punto.fecha_id) }));
}

/** Whole percent of a 0–1 value; `null` stays `null` (never 0 %). */
export function aPorcentaje(valor: number | null | undefined): number | null {
	return valor === null || valor === undefined || Number.isNaN(valor)
		? null
		: Math.round(valor * 100);
}

/** Two passes share viewing geometry only if orbit direction and track match. */
export function mismaGeometria(a: Fecha, b: Fecha) {
	return a.orbita === b.orbita && a.track === b.track;
}

/** A pass with heavy rain in the three previous days is not counted for high tide (RN-09). */
export function excluidaPorLluvia(
	fecha: Fecha,
	manifiesto: { umbrales: { lluvia_max_mm?: number } }
) {
	const limite = manifiesto.umbrales.lluvia_max_mm;
	return (
		fecha.marea_nivel === 'alta' &&
		!fecha.usada_en_if_alta &&
		limite !== undefined &&
		fecha.lluvia_3d_mm !== null &&
		fecha.lluvia_3d_mm >= limite
	);
}

/** True when no pass of the version has a tide estimate: `if_alta` cannot exist. */
export function sinMarea(manifiesto: Manifiesto) {
	return manifiesto.fechas.every(f => f.marea_m === null);
}

/** Vertical extent of the score, symmetric and never narrower than ±1 m. */
export function rangoDeMarea(fechas: readonly Fecha[]): [number, number] {
	const mareas = fechas.map(f => f.marea_m).filter((m): m is number => m !== null);
	const tope = Math.max(1, ...mareas.map(Math.abs));
	const techo = Math.ceil(tope);
	return [-techo, techo];
}

export const ms = (iso: string) => Date.parse(iso);

/** Index of the pass with the given id, or of the last pass when it is missing. */
export function indiceDeFecha(fechas: readonly Fecha[], id: string | undefined) {
	const k = id ? fechas.findIndex(f => f.id === id) : -1;
	return k >= 0 ? k : Math.max(0, fechas.length - 1);
}

const PAISES: Record<string, { es: string; en: string }> = {
	NI: { es: 'Nicaragua', en: 'Nicaragua' },
	HN: { es: 'Honduras', en: 'Honduras' },
	SV: { es: 'El Salvador', en: 'El Salvador' }
};

export function nombreDePais(codigo: string | null | undefined, idioma: 'es' | 'en') {
	if (!codigo) return null;
	return PAISES[codigo]?.[idioma] ?? codigo;
}
