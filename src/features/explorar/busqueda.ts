import { z } from 'zod';

/**
 * State of the explore view, kept in the URL so a shared link reopens exactly
 * the same view: region, version, mode, pass, layer, comparison, cell and zoom.
 * Unknown or malformed values are dropped instead of breaking the page.
 */

export const MODOS = ['ritmo', 'sintonia', 'estanques'] as const;
export type Modo = (typeof MODOS)[number];

const texto = z.string().min(1).max(80).optional().catch(undefined);

export const busquedaSchema = z.object({
	region: texto,
	version: texto,
	modo: z.enum(MODOS).optional().catch(undefined),
	/** Selected pass (A in a comparison). */
	fecha: texto,
	capa: z.enum(['rgb', 'clases']).optional().catch(undefined),
	/** Second pass of the comparison (B). */
	comparar: texto,
	/** Connectivity: show only possible disconnection. */
	solo: z.boolean().optional().catch(undefined),
	/** Inspected point as `lon,lat`. */
	punto: texto,
	/** Map view as `zoom/lat/lon`. */
	vista: texto,
	estanque: texto,
	clase: z.enum(['activo', 'abandonado']).optional().catch(undefined),
	orden: z.enum(['puntaje', 'area', 'distancia', 'inundacion']).optional().catch(undefined)
});

export type Busqueda = z.infer<typeof busquedaSchema>;

const numeros = (valor: string | undefined, separador: string, cantidad: number) => {
	const partes = valor?.split(separador).map(Number);
	return partes && partes.length === cantidad && partes.every(Number.isFinite) ? partes : null;
};

export function leerPunto(valor: string | undefined) {
	const p = numeros(valor, ',', 2);
	if (!p || Math.abs(p[0]!) > 180 || Math.abs(p[1]!) > 90) return null;
	return { lon: p[0]!, lat: p[1]! };
}

export const escribirPunto = (lon: number, lat: number) => `${lon.toFixed(5)},${lat.toFixed(5)}`;

export function leerVista(valor: string | undefined) {
	const p = numeros(valor, '/', 3);
	if (!p || p[0]! < 1 || p[0]! > 20 || Math.abs(p[1]!) > 90 || Math.abs(p[2]!) > 180) return null;
	return { zoom: p[0]!, lat: p[1]!, lon: p[2]! };
}

export const escribirVista = (v: { zoom: number; lat: number; lon: number }) =>
	`${v.zoom.toFixed(2)}/${v.lat.toFixed(4)}/${v.lon.toFixed(4)}`;
