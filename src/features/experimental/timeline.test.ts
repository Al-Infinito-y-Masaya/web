import { describe, expect, it } from 'vitest';

import { excluidaPorLluvia, rangoDeMarea } from '@/features/datos/dominio';

import { manifestSchema } from './data';
import raw from './fixtures/manifest.json';
import { timelineData } from './timeline';

describe('partitura original con el contrato experimental', () => {
	it('conserva fecha, marea, pista y orden de las veinte adquisiciones', () => {
		const m = manifestSchema.parse(raw),
			score = timelineData(m);
		expect(score.fechas).toHaveLength(20);
		score.fechas.forEach((f, i) => {
			expect([f.id, f.fecha_hora, f.track, f.orbita, f.marea_m]).toEqual([
				m.fechas[i]!.fecha_id,
				m.fechas[i]!.hora_utc,
				m.fechas[i]!.pista,
				m.fechas[i]!.direccion,
				m.fechas[i]!.marea_m
			]);
		});
		expect(score.fechas.filter(f => f.usada_en_if_alta)).toHaveLength(5);
		expect(rangoDeMarea(score.fechas)).toEqual([-2, 2]);
	});
	it('no inventa lluvia, exclusiones ni brechas instrumentales', () => {
		const score = timelineData(manifestSchema.parse(raw));
		expect(score.brechas).toEqual([]);
		expect(
			score.fechas.every(f => f.lluvia_3d_mm === null && !excluidaPorLluvia(f, score))
		).toBe(true);
	});
});
