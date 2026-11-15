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
	it('limita la memoria a tres fuentes recientes y cancela solicitudes al cambiar de modo', () => {
		const { cache, port, ready } = setup();
		for (let i = 1; i <= 4; i++) {
			cache.select(String(i), '/' + i);
			ready.add('acquisition-' + i);
			cache.check('acquisition-' + i);
		}
		expect(port.remove).toHaveBeenCalledWith('acquisition-1');
		cache.select('5', '/5');
		cache.deactivate();
		expect(port.remove).toHaveBeenCalledWith('acquisition-5');
	});
});
