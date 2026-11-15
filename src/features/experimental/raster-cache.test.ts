import { describe, expect, it, vi } from 'vitest';

import { RasterCache, type RasterPort } from './raster-cache';

function setup() {
	const ready = new Set<string>();
	const port: RasterPort = {
		add: vi.fn(),
		show: vi.fn(),
		remove: vi.fn(),
		loaded: id => ready.has(id)
	};
	const notify = vi.fn();
	return { ready, port, notify, cache: new RasterCache(port, notify) };
}
describe('transiciones del mapa', () => {
	it('conserva la fecha visible hasta que la siguiente termina y reutiliza la anterior', () => {
		const { cache, port, ready, notify } = setup();
		cache.select('a', '/a');
		ready.add('acquisition-1');
		cache.check('acquisition-1');
		vi.mocked(port.show).mockClear();
		cache.select('b', '/b');
		expect(port.show).not.toHaveBeenCalledWith('acquisition-1', false, 0);
		expect(notify).toHaveBeenLastCalledWith({
			key: 'b',
			displayed: 'a',
			loading: true,
			error: false
		});
		ready.add('acquisition-2');
		cache.check('acquisition-2');
		cache.select('a', '/a');
		expect(port.add).toHaveBeenCalledTimes(2);
		expect(notify).toHaveBeenLastCalledWith({
			key: 'a',
			displayed: 'a',
			loading: false,
			error: false
		});
	});
	it('descarta respuestas tardías y permite reintentar sin recargar la página', () => {
		const { cache, port, ready, notify } = setup();
		cache.select('a', '/a');
		cache.select('b', '/b');
		ready.add('acquisition-1');
		cache.check('acquisition-1');
		expect(port.remove).toHaveBeenCalledWith('acquisition-1');
		expect(notify).toHaveBeenLastCalledWith({
			key: 'b',
			displayed: null,
			loading: true,
			error: false
		});
		cache.fail('acquisition-2');
		expect(notify).toHaveBeenLastCalledWith({
			key: 'b',
			displayed: null,
			loading: false,
			error: true
		});
		cache.retry('b', '/b');
		ready.add('acquisition-3');
		cache.check('acquisition-3');
		expect(notify).toHaveBeenLastCalledWith({
			key: 'b',
			displayed: 'b',
			loading: false,
			error: false
		});
	});
	it('limita la memoria a cinco fuentes recientes y cancela solicitudes al cambiar de modo', () => {
		const { cache, port, ready } = setup();
		for (let i = 1; i <= 6; i++) {
			cache.select(String(i), '/' + i);
			ready.add('acquisition-' + i);
			cache.check('acquisition-' + i);
		}
		expect(port.remove).toHaveBeenCalledWith('acquisition-1');
		expect(port.remove).not.toHaveBeenCalledWith('acquisition-2');
		cache.select('7', '/7');
		cache.deactivate();
		expect(port.remove).toHaveBeenCalledWith('acquisition-7');
	});
	it('precarga las vecinas sin mostrarlas y las muestra al instante al elegirlas', () => {
		const { cache, port, ready, notify } = setup();
		cache.select('a', '/a');
		ready.add('acquisition-1');
		cache.check('acquisition-1');
		cache.prefetch([
			['b', '/b'],
			['c', '/c']
		]);
		expect(port.add).toHaveBeenCalledWith('acquisition-2', '/b');
		expect(port.show).toHaveBeenLastCalledWith('acquisition-3', true, 0);
		ready.add('acquisition-2');
		vi.mocked(port.add).mockClear();
		cache.select('b', '/b');
		expect(port.add).not.toHaveBeenCalled();
		expect(notify).toHaveBeenLastCalledWith({
			key: 'b',
			displayed: 'b',
			loading: false,
			error: false
		});
		// La anterior se desvanece en lugar de ocultarse de golpe.
		expect(port.show).toHaveBeenCalledWith('acquisition-1', true, 0);
		expect(port.show).toHaveBeenCalledWith('acquisition-2', true, 1);
	});
	it('no expulsa las vecinas ni cancela una vecina reemplazada', () => {
		const { cache, port, ready } = setup();
		for (let i = 1; i <= 5; i++) {
			cache.select(String(i), '/' + i);
			ready.add('acquisition-' + i);
			cache.check('acquisition-' + i);
		}
		cache.prefetch([
			['6', '/6'],
			['7', '/7']
		]);
		expect(port.remove).not.toHaveBeenCalledWith('acquisition-6');
		expect(port.remove).not.toHaveBeenCalledWith('acquisition-7');
		cache.select('6', '/6');
		cache.select('8', '/8');
		expect(port.remove).not.toHaveBeenCalledWith('acquisition-6');
	});
	it('descarta en silencio una vecina que falla', () => {
		const { cache, port, ready, notify } = setup();
		cache.select('a', '/a');
		ready.add('acquisition-1');
		cache.check('acquisition-1');
		cache.prefetch([['b', '/b']]);
		notify.mockClear();
		cache.fail('acquisition-2');
		expect(port.remove).toHaveBeenCalledWith('acquisition-2');
		expect(notify).not.toHaveBeenCalled();
	});
});
