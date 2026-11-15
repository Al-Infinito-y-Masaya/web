import { describe, expect, it } from 'vitest';

import { createRng, mangroveSvg, shrimpSvg, SURFACE_Y, wave } from './art';

describe('createRng', () => {
	it('repite la misma secuencia con la misma semilla', () => {
		const a = createRng(42);
		const b = createRng(42);
		const seqA = Array.from({ length: 5 }, a);
		expect(Array.from({ length: 5 }, b)).toEqual(seqA);
		for (const n of seqA) {
			expect(n).toBeGreaterThanOrEqual(0);
			expect(n).toBeLessThan(1);
		}
	});
});

describe('wave', () => {
	it('se mantiene cerca de la superficie del agua', () => {
		for (let x = 0; x <= 3200; x += 37) {
			expect(Math.abs(wave(x) - SURFACE_Y)).toBeLessThanOrEqual(14);
		}
	});
});

describe('dibujos SVG', () => {
	it('el camarón usa el tamaño pedido y sus filtros', () => {
		const svg = shrimpSvg(1, 0, 600, 260);
		expect(svg).toContain('width="600"');
		expect(svg).toContain('height="260"');
		expect(svg).toContain('id="wc"');
		expect(svg).toContain('id="cr"');
	});

	it('el manglar conserva la forma y solo cambia el temblor según la semilla', () => {
		const a = mangroveSvg(13, 100, 100);
		const b = mangroveSvg(17, 100, 100);
		expect(a).not.toEqual(b);
		const shape = (svg: string) => svg.slice(svg.indexOf('</defs>'));
		expect(shape(a)).toEqual(shape(b));
	});
});
