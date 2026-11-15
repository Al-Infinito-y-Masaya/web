import { describe, expect, test } from 'vitest';

import { pasoDeMarea, PASOS } from './sonido';

describe('pasoDeMarea', () => {
	const rango = [-2, 2] as const;

	test('low tide is the lowest step and high tide the highest', () => {
		expect(pasoDeMarea(-2, rango)).toBe(0);
		expect(pasoDeMarea(2, rango)).toBe(PASOS - 1);
	});

	test('pitch never decreases as the tide rises', () => {
		let previo = -1;
		for (let marea = -2; marea <= 2; marea += 0.1) {
			const paso = pasoDeMarea(marea, rango);
			expect(paso).toBeGreaterThanOrEqual(previo);
			previo = paso;
		}
	});

	test('values outside the range are clamped', () => {
		expect(pasoDeMarea(-9, rango)).toBe(0);
		expect(pasoDeMarea(9, rango)).toBe(PASOS - 1);
		expect(pasoDeMarea(1, [0, 0])).toBe(0);
	});
});
