import type { Middleware } from 'openapi-fetch';
import { describe, expect, test, vi } from 'vitest';

import { APIClient, type PathClient } from '@/shared/client/api-client';
import { errorMiddleware } from '@/shared/client/middleware/error-middleware';
import { logMiddleware } from '@/shared/client/middleware/log-middleware';

function makeClient() {
	const use = vi.fn();
	const request = vi.fn();

	const pathClient = {
		use,
		request
	} as unknown as PathClient;

	return {
		pathClient,
		use,
		request
	};
}

describe('APIClient', () => {
	test('registers middlewares', () => {
		const { pathClient, use } = makeClient();

		const firstMiddleware: Middleware = errorMiddleware;
		const secondMiddleware: Middleware = logMiddleware;

		new APIClient(pathClient, [firstMiddleware, secondMiddleware]);

		expect(use).toHaveBeenCalledTimes(2);

		expect(use).toHaveBeenNthCalledWith(1, firstMiddleware);

		expect(use).toHaveBeenNthCalledWith(2, secondMiddleware);
	});

	test('GET delegates request to path client', async () => {
		const { pathClient, request } = makeClient();

		const expected = { data: [] };

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const result = await client.GET('/regiones/');

		expect(request).toHaveBeenCalledOnce();

		expect(request).toHaveBeenCalledWith('get', '/regiones/');

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('GET delegates path and query params', async () => {
		const { pathClient, request } = makeClient();

		const expected = { data: { id: 'c_458450_1428650' } };

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const options = {
			params: {
				path: { region: 'estero_real', version: '1.3.0' },
				query: { lon: -87.38, lat: 12.92 }
			}
		};

		const result = await client.GET('/regiones/{region}/versiones/{version}/celdas/', options);

		expect(request).toHaveBeenCalledWith(
			'get',
			'/regiones/{region}/versiones/{version}/celdas/',
			options
		);

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('POST delegates path params and body', async () => {
		const { pathClient, request } = makeClient();

		const expected = { data: { exploracion: true } };

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const options = {
			params: { path: { region: 'estero_real', version: '1.3.0' } },
			body: {
				ow_hh_db: null,
				ow_hv_db: null,
				iv_hh_db: null,
				iv_ratio_db: null,
				marea_alta_m: null,
				lluvia_max_mm: null,
				if_alta_desconectada: 0.3,
				min_fechas_alta: null,
				mayoria: null
			}
		};

		const result = await client.POST(
			'/regiones/{region}/versiones/{version}/exploraciones/',
			options
		);

		expect(request).toHaveBeenCalledWith(
			'post',
			'/regiones/{region}/versiones/{version}/exploraciones/',
			options
		);

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('DELETE delegates path params', async () => {
		const { pathClient, request } = makeClient();

		const expected = { data: undefined };

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const options = { params: { path: { id: 7 } } };

		const result = await client.DELETE('/auth/group/{id}/', options);

		expect(request).toHaveBeenCalledWith('delete', '/auth/group/{id}/', options);

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('turns a rejected request into an Err', async () => {
		const { pathClient, request } = makeClient();

		request.mockRejectedValue(new Error('boom'));

		const client = new APIClient(pathClient);

		const result = await client.GET('/regiones/');

		expect(result.isErr()).toBe(true);
	});
});
