import type { Middleware } from 'openapi-fetch';
import { describe, expect, test, vi } from 'vitest';

import { CSRFManager } from '@/shared/client/managers/csrf-manager';
import { CSRFMiddleware } from '@/shared/client/middleware/csrf-middleware';

type OnRequestContext = Parameters<NonNullable<Middleware['onRequest']>>[0];

function makeRequestContext(request: Request): OnRequestContext {
	return {
		id: 'request-1',
		request
	} as OnRequestContext;
}

describe('CSRFMiddleware', () => {
	test('injects csrf token into request', async () => {
		const fetchToken = vi.fn().mockResolvedValue('csrf-token');

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken
		});

		const middleware = CSRFMiddleware(csrf);

		const request = new Request('http://api.test/items');

		const result = await middleware.onRequest!(makeRequestContext(request));

		expect(fetchToken).toHaveBeenCalledOnce();

		expect(result).toBeInstanceOf(Request);

		expect((result as Request).headers.get('x-csrftoken')).toBe('csrf-token');
	});

	test('preserves existing request headers', async () => {
		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken: vi.fn().mockResolvedValue('csrf-token')
		});

		const middleware = CSRFMiddleware(csrf);

		const request = new Request('http://api.test/items', {
			headers: {
				'x-custom-header': 'custom-value'
			}
		});

		const result = (await middleware.onRequest!(makeRequestContext(request))) as Request;

		expect(result.headers.get('x-csrftoken')).toBe('csrf-token');
		expect(result.headers.get('x-custom-header')).toBe('custom-value');
	});

	test('rejects when csrf token cannot be obtained', async () => {
		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken: vi.fn().mockRejectedValue(new Error('Could not obtain CSRF'))
		});

		const middleware = CSRFMiddleware(csrf);

		const request = new Request('http://api.test/items');

		await expect(middleware.onRequest!(makeRequestContext(request))).rejects.toThrow(
			'Could not obtain CSRF'
		);
	});
});
