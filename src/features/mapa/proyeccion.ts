/**
 * Web Mercator math for the map viewer.
 *
 * The backend paints every layer as a PNG in Web Mercator and declares its
 * corners in lon/lat (`manifest.limites`), so a layer is an axis-aligned
 * rectangle in this projection. "World" coordinates go from 0 to 1 on both
 * axes; at zoom `z` the world measures `256 · 2^z` CSS pixels.
 */

export const TESELA = 256;
export const ZOOM_MIN = 6;
export const ZOOM_MAX = 17;
const LAT_MAX = 85.05112878;
const CIRCUNFERENCIA_M = 40_075_016.686;

export type Caja = readonly [oeste: number, sur: number, este: number, norte: number];
export type Vista = { x: number; y: number; zoom: number };
export type Tamano = { ancho: number; alto: number };

export const acotar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function lonAMundo(lon: number) {
	return (lon + 180) / 360;
}

export function latAMundo(lat: number) {
	const phi = (acotar(lat, -LAT_MAX, LAT_MAX) * Math.PI) / 180;
	return (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2;
}

export function mundoALon(x: number) {
	return x * 360 - 180;
}

export function mundoALat(y: number) {
	return (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
}

export const escala = (zoom: number) => TESELA * 2 ** zoom;

/** Screen position (CSS px, from the top-left of the viewer) of a lon/lat. */
export function aPantalla(lon: number, lat: number, vista: Vista, t: Tamano) {
	const e = escala(vista.zoom);
	return {
		x: (lonAMundo(lon) - vista.x) * e + t.ancho / 2,
		y: (latAMundo(lat) - vista.y) * e + t.alto / 2
	};
}

/** Lon/lat under a screen position. */
export function aLonLat(px: number, py: number, vista: Vista, t: Tamano) {
	const e = escala(vista.zoom);
	return {
		lon: mundoALon(vista.x + (px - t.ancho / 2) / e),
		lat: mundoALat(vista.y + (py - t.alto / 2) / e)
	};
}

/** Screen rectangle covered by a lon/lat box. */
export function cajaAPantalla(caja: Caja, vista: Vista, t: Tamano) {
	const a = aPantalla(caja[0], caja[3], vista, t);
	const b = aPantalla(caja[2], caja[1], vista, t);
	return { izquierda: a.x, arriba: a.y, ancho: b.x - a.x, alto: b.y - a.y };
}

/** The view that shows the whole box with a margin (in CSS px) on every side. */
export function encajar(
	caja: Caja,
	t: Tamano,
	margen: { arriba?: number; derecha?: number; abajo?: number; izquierda?: number } = {}
): Vista {
	const { arriba = 24, derecha = 24, abajo = 24, izquierda = 24 } = margen;
	const x0 = lonAMundo(caja[0]);
	const x1 = lonAMundo(caja[2]);
	const y0 = latAMundo(caja[3]);
	const y1 = latAMundo(caja[1]);
	const ancho = Math.max(1, t.ancho - izquierda - derecha);
	const alto = Math.max(1, t.alto - arriba - abajo);
	const zoom = acotar(
		Math.log2(Math.min(ancho / (x1 - x0), alto / (y1 - y0)) / TESELA),
		ZOOM_MIN,
		ZOOM_MAX
	);
	const e = escala(zoom);
	// Shift the centre so the box sits in the middle of the free area, not of the viewer.
	return {
		x: (x0 + x1) / 2 - (izquierda - derecha) / 2 / e,
		y: (y0 + y1) / 2 - (arriba - abajo) / 2 / e,
		zoom
	};
}

/** Zooms by `delta` levels keeping the point under (px, py) fixed. */
export function zoomEn(vista: Vista, delta: number, px: number, py: number, t: Tamano): Vista {
	const zoom = acotar(vista.zoom + delta, ZOOM_MIN, ZOOM_MAX);
	const antes = escala(vista.zoom);
	const despues = escala(zoom);
	const dx = px - t.ancho / 2;
	const dy = py - t.alto / 2;
	return {
		x: vista.x + dx / antes - dx / despues,
		y: acotar(vista.y + dy / antes - dy / despues, 0, 1),
		zoom
	};
}

/** Metres on the ground per CSS pixel at a latitude. */
export function metrosPorPixel(lat: number, zoom: number) {
	return (CIRCUNFERENCIA_M * Math.cos((lat * Math.PI) / 180)) / escala(zoom);
}

/** Longest "nice" distance that fits in `maxPx`, for the scale bar. */
export function barraDeEscala(lat: number, zoom: number, maxPx = 120) {
	const mpp = metrosPorPixel(lat, zoom);
	const pasos = [50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000];
	let metros = pasos[0]!;
	for (const paso of pasos) if (paso / mpp <= maxPx) metros = paso;
	return { metros, px: metros / mpp };
}

export type Tesela = {
	z: number;
	x: number;
	y: number;
	izquierda: number;
	arriba: number;
	lado: number;
};

/** Basemap tiles that cover the viewer. `zMax` is the deepest level the source serves. */
export function teselasVisibles(vista: Vista, t: Tamano, zMax = 14): Tesela[] {
	const z = acotar(Math.round(vista.zoom), 0, zMax);
	const n = 2 ** z;
	const lado = escala(vista.zoom) / n;
	const x0 = vista.x * n - t.ancho / 2 / lado;
	const y0 = vista.y * n - t.alto / 2 / lado;
	const salida: Tesela[] = [];
	for (
		let ty = Math.max(0, Math.floor(y0));
		ty <= Math.min(n - 1, Math.floor(y0 + t.alto / lado));
		ty++
	) {
		for (let tx = Math.floor(x0); tx <= Math.floor(x0 + t.ancho / lado); tx++) {
			salida.push({
				z,
				x: ((tx % n) + n) % n,
				y: ty,
				izquierda: (tx - x0) * lado,
				arriba: (ty - y0) * lado,
				lado
			});
		}
	}
	return salida;
}

export function urlDeTesela(plantilla: string, tesela: Tesela) {
	return plantilla
		.replace('{z}', String(tesela.z))
		.replace('{x}', String(tesela.x))
		.replace('{y}', String(tesela.y));
}
