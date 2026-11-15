import { describe, expect, it } from 'vitest';

import { neighborDates, stepDate } from './stepping';

const dates = [
	{ direccion: 'desc' },
	{ direccion: 'asc' },
	{ direccion: 'desc' },
	{ direccion: 'asc' },
	{ direccion: 'desc' }
];

describe('avance entre pasadas', () => {
	it('alterna órbitas cuando se recorren todas', () => {
		expect(stepDate(dates, 0, 1, false)).toBe(1);
		expect(stepDate(dates, 0, -1, false)).toBe(4);
	});
	it('salta a la siguiente pasada de la misma órbita y da la vuelta', () => {
		expect(stepDate(dates, 0, 1, true)).toBe(2);
		expect(stepDate(dates, 3, 1, true)).toBe(1);
		expect(stepDate(dates, 1, -1, true)).toBe(3);
	});
	it('se queda en el lugar si no hay otra pasada de esa órbita', () => {
		expect(stepDate([{ direccion: 'asc' }, { direccion: 'desc' }], 0, 1, true)).toBe(0);
		expect(stepDate([], 0, 1, true)).toBe(0);
	});
	it('precarga la siguiente y la anterior sin repetir ni incluir la actual', () => {
		expect(neighborDates(dates, 0, true)).toEqual([2, 4]);
		expect(neighborDates(dates, 2, false)).toEqual([3, 1]);
		expect(neighborDates([{ direccion: 'asc' }, { direccion: 'asc' }], 0, true)).toEqual([1]);
		expect(neighborDates([{ direccion: 'asc' }], 0, true)).toEqual([]);
	});
});
