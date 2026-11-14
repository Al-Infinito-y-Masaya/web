import type { Middleware } from 'openapi-fetch';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { logMiddleware } from '@/shared/client/middleware/log-middleware';

type OnRequestContext = Parameters<NonNullable<Middleware['onRequest']>>[0];

type OnResponseContext = Parameters<NonNullable<Middleware['onResponse']>>[0];

function requestContext(request: Request): OnRequestContext {
	return {
		id: 'request-1',
		request
	} as OnRequestContext;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('logMiddleware', () => {
	test('logs request method and path', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		const request = new Request('http://api.test/items');

		const result = logMiddleware.onRequest!(requestContext(request));

		expect(consoleSpy).toHaveBeenCalledWith('GET Request to: /items');

		expect(result).toBe(request);
	});

	test('logs query parameters', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		const request = new Request('http://api.test/items?page=2&search=wid');

		logMiddleware.onRequest!(requestContext(request));

		expect(consoleSpy).toHaveBeenCalledWith('Query Params:', {
			page: '2',
			search: 'wid'
		});
	});

	test('does not log query params when none exist', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		const request = new Request('http://api.test/items');

		logMiddleware.onRequest!(requestContext(request));

		expect(consoleSpy).toHaveBeenCalledOnce();
	});

	test('logs response status and schema path', () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

		const response = new Response(null, {
			status: 200
		});

		const result = logMiddleware.onResponse!({
			id: 'request-1',
			schemaPath: '/items',
			response
		} as OnResponseContext);

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('(status 200) from path /items')
		);

		expect(result).toBe(response);
	});
});
