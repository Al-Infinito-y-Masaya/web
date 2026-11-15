import { describe, expect, test } from 'vitest';

import {
	aLonLat,
	aPantalla,
	barraDeEscala,
	cajaAPantalla,
	encajar,
	teselasVisibles,
	urlDeTesela,
	zoomEn,
	type Caja
} from './proyeccion';

const tamano = { ancho: 800, alto: 600 };
const caja: Caja = [-87.4, 12.8, -87.05, 13.1];

describe('proyeccion', () => {
	test('screen and lon/lat conversions are inverse', () => {
		const vista = encajar(caja, tamano);
		const p = aPantalla(-87.2, 12.95, vista, tamano);
		const vuelta = aLonLat(p.x, p.y, vista, tamano);
		expect(vuelta.lon).toBeCloseTo(-87.2, 6);
		expect(vuelta.lat).toBeCloseTo(12.95, 6);
	});

	test('fitting a box keeps it inside the viewer, clear of the margins', () => {
		const margen = { izquierda: 300, arriba: 50, derecha: 20, abajo: 100 };
		const r = cajaAPantalla(caja, encajar(caja, tamano, margen), tamano);
		expect(r.izquierda).toBeGreaterThanOrEqual(300 - 0.5);
		expect(r.arriba).toBeGreaterThanOrEqual(50 - 0.5);
		expect(r.izquierda + r.ancho).toBeLessThanOrEqual(800 - 20 + 0.5);
		expect(r.arriba + r.alto).toBeLessThanOrEqual(600 - 100 + 0.5);
	});

	test('zooming keeps the point under the cursor fixed', () => {
		const vista = encajar(caja, tamano);
		const antes = aLonLat(200, 150, vista, tamano);
		const despues = aLonLat(200, 150, zoomEn(vista, 1.5, 200, 150, tamano), tamano);
		expect(despues.lon).toBeCloseTo(antes.lon, 6);
		expect(despues.lat).toBeCloseTo(antes.lat, 6);
	});

	test('zoom is clamped', () => {
		const vista = encajar(caja, tamano);
		expect(zoomEn(vista, 50, 0, 0, tamano).zoom).toBe(17);
		expect(zoomEn(vista, -50, 0, 0, tamano).zoom).toBe(6);
	});

	test('tiles cover the whole viewer', () => {
		const teselas = teselasVisibles(encajar(caja, tamano), tamano);
		expect(Math.min(...teselas.map(t => t.izquierda))).toBeLessThanOrEqual(0);
		expect(Math.min(...teselas.map(t => t.arriba))).toBeLessThanOrEqual(0);
		expect(Math.max(...teselas.map(t => t.izquierda + t.lado))).toBeGreaterThanOrEqual(800);
		expect(Math.max(...teselas.map(t => t.arriba + t.lado))).toBeGreaterThanOrEqual(600);
		expect(urlDeTesela('t/{z}/{y}/{x}.jpg', teselas[0]!)).toBe(
			`t/${teselas[0]!.z}/${teselas[0]!.y}/${teselas[0]!.x}.jpg`
		);
	});

	test('the scale bar picks a round distance that fits', () => {
		const barra = barraDeEscala(13, 11, 120);
		expect(barra.px).toBeLessThanOrEqual(120);
		expect([50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]).toContain(
			barra.metros
		);
	});
});
