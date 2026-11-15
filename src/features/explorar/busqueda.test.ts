import { describe, expect, test } from 'vitest';

import { busquedaSchema, escribirPunto, escribirVista, leerPunto, leerVista } from './busqueda';

describe('busqueda', () => {
	test('drops malformed values instead of failing', () => {
		expect(busquedaSchema.parse({ modo: 'otro', capa: 3, solo: 'x', fecha: '' })).toEqual({});
	});

	test('keeps a shared view', () => {
		const enlace = { region: 'estero_real', version: '1.3.0', modo: 'sintonia', solo: true };
		expect(busquedaSchema.parse(enlace)).toEqual(enlace);
	});

	test('point and view round-trip', () => {
		expect(leerPunto(escribirPunto(-87.25, 12.95))).toEqual({ lon: -87.25, lat: 12.95 });
		expect(leerVista(escribirVista({ zoom: 11.5, lat: 12.95, lon: -87.22 }))).toEqual({
			zoom: 11.5,
			lat: 12.95,
			lon: -87.22
		});
	});

	test('rejects impossible coordinates', () => {
		expect(leerPunto('200,10')).toBeNull();
		expect(leerPunto('a,b')).toBeNull();
		expect(leerVista('11/12')).toBeNull();
		expect(leerVista(undefined)).toBeNull();
	});
});
