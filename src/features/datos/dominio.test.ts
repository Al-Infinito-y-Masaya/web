import { describe, expect, test } from 'vitest';

import {
	aPorcentaje,
	estadoDeCelda,
	excluidaPorLluvia,
	mismaGeometria,
	rangoDeMarea,
	sinMarea,
	unirSerie
} from './dominio';
import { celdaSchema, manifiestoSchema, type Celda, type Fecha, type Manifiesto } from './esquemas';

const fecha = (id: string, extra: Partial<Fecha> = {}): Fecha => ({
	id,
	fecha_hora: '2026-10-14T11:22:20Z',
	track: 33,
	orbita: 'asc',
	marea_m: 0.81,
	marea_nivel: 'alta',
	lluvia_3d_mm: 12,
	usada_en_if_alta: true,
	capas: {},
	...extra
});

const metricas = {
	if: 0.31,
	if_alta: 0.05,
	n_fechas: 26,
	n_fechas_alta: 7,
	desconectada: true,
	datos_suficientes: true,
	p_error: 0.18
};

const celda = (extra: Partial<Celda> = {}): Celda => ({
	id: 'c_458450_1428650',
	centroide: [-87.38, 12.92],
	en_mascara: true,
	metricas,
	cambio: null,
	serie: [],
	...extra
});

const manifiesto = (fechas: Fecha[]) =>
	({ fechas, umbrales: { perfil: 'p', version: 1, lluvia_max_mm: 60 } }) as unknown as Manifiesto;

describe('estadoDeCelda', () => {
	test('metricas null means outside the mangrove mask', () => {
		expect(estadoDeCelda(celda({ en_mascara: false, metricas: null }))).toBe('fuera');
	});

	test('if_alta null is insufficient data, never a disconnection', () => {
		const m = { ...metricas, if_alta: null, datos_suficientes: false, desconectada: false };
		expect(estadoDeCelda(celda({ metricas: m }))).toBe('insuficiente');
	});

	test('connected and disconnected follow the flag of the backend', () => {
		expect(estadoDeCelda(celda())).toBe('desconectada');
		expect(estadoDeCelda(celda({ metricas: { ...metricas, desconectada: false } }))).toBe(
			'conectada'
		);
	});
});

describe('aPorcentaje', () => {
	test('rounds to whole percent', () => {
		expect(aPorcentaje(0.05)).toBe(5);
	});

	test('keeps null as null instead of 0', () => {
		expect(aPorcentaje(null)).toBeNull();
		expect(aPorcentaje(undefined)).toBeNull();
	});
});

describe('unirSerie', () => {
	test('joins by fecha_id and never borrows a neighbouring pass', () => {
		const serie = [
			{ fecha_id: 'a', hh_db: -6, hv_db: -14, clase: 'NI' as const },
			{ fecha_id: 'zz', hh_db: null, hv_db: null, clase: 'ND' as const }
		];
		const unida = unirSerie(celda({ serie }), [fecha('a'), fecha('b')]);
		expect(unida[0]!.fecha?.id).toBe('a');
		expect(unida[1]!.fecha).toBeUndefined();
	});
});

describe('passes', () => {
	test('geometry matches only with the same orbit and track', () => {
		expect(mismaGeometria(fecha('a'), fecha('b'))).toBe(true);
		expect(mismaGeometria(fecha('a'), fecha('b', { orbita: 'desc' }))).toBe(false);
		expect(mismaGeometria(fecha('a'), fecha('b', { track: 98 }))).toBe(false);
	});

	test('a high-tide pass with heavy rain is excluded', () => {
		const lluviosa = fecha('a', { lluvia_3d_mm: 82, usada_en_if_alta: false });
		expect(excluidaPorLluvia(lluviosa, manifiesto([lluviosa]))).toBe(true);
		expect(excluidaPorLluvia(fecha('b'), manifiesto([]))).toBe(false);
		const media = fecha('c', { marea_nivel: 'media', usada_en_if_alta: false });
		expect(excluidaPorLluvia(media, manifiesto([media]))).toBe(false);
	});

	test('a version without tide estimates is detected', () => {
		const sin = fecha('a', { marea_m: null, marea_nivel: 'desconocida' });
		expect(sinMarea(manifiesto([sin]))).toBe(true);
		expect(sinMarea(manifiesto([sin, fecha('b')]))).toBe(false);
	});

	test('the tide range is symmetric, at least one metre, and ignores nulls', () => {
		expect(rangoDeMarea([fecha('a', { marea_m: 0.2 })])).toEqual([-1, 1]);
		expect(
			rangoDeMarea([fecha('a', { marea_m: -1.4 }), fecha('b', { marea_m: null })])
		).toEqual([-2, 2]);
	});
});

describe('contract schemas', () => {
	test('accept the cell of the contract document', () => {
		const ejemplo = {
			id: 'c_458450_1428650',
			centroide: [-87.3832, 12.9221],
			pais: 'NI',
			en_mascara: true,
			metricas: { ...metricas, if_esperada: 0.86 },
			cambio: { fecha_id: '2026-09-20_033_asc', confianza: 0.97, delta_hv_db: -2.7 },
			serie: [
				{
					fecha_id: '2026-06-28_033_asc',
					hh_db: -6.1,
					hv_db: -14.2,
					coherencia: null,
					clase: 'NI'
				}
			]
		};
		expect(celdaSchema.safeParse(ejemplo).success).toBe(true);
	});

	test('reject an unknown class and a manifest without passes', () => {
		const mala = { ...celda(), serie: [{ fecha_id: 'a', hh_db: 0, hv_db: 0, clase: 'XX' }] };
		expect(celdaSchema.safeParse(mala).success).toBe(false);
		expect(manifiestoSchema.safeParse({ formato: 'mangroove/1' }).success).toBe(false);
	});
});
