import type { Middleware } from 'openapi-fetch';
import { describe, expect, test, vi } from 'vitest';

import { CSRFManager } from '@/shared/client/managers/csrf-manager';
import { JWTManager } from '@/shared/client/managers/jwt-manager';
import { JWTMiddleware } from '@/shared/client/middleware/jwt-middleware';

type OnRequestContext = Parameters<NonNullable<Middleware['onRequest']>>[0];

type OnResponseContext = Parameters<NonNullable<Middleware['onResponse']>>[0];

type OnErrorContext = Parameters<NonNullable<Middleware['onError']>>[0];

function requestContext(request: Request, id = 'request-1'): OnRequestContext {
	return {
		id,
		request
	} as OnRequestContext;
}

function responseContext(response: Response, id = 'request-1'): OnResponseContext {
	return {
		id,
		response
	} as OnResponseContext;
}

describe('JWTMiddleware', () => {
	test('does nothing when response is not 401', async () => {
		const refreshAccess = vi.fn().mockResolvedValue(true);

		const jwt = new JWTManager({
			verifyAccess: vi.fn().mockResolvedValue(true),
			refreshAccess
		});

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken: vi.fn().mockResolvedValue('token')
		});

		const send = vi.fn<typeof fetch>();

		const middleware = JWTMiddleware(jwt, csrf, {
			send
		});

		const request = new Request('http://api.test/items');
		const response = new Response(null, { status: 200 });

		middleware.onRequest!(requestContext(request));

		const result = await middleware.onResponse!(responseContext(response));

		expect(result).toBe(response);

		expect(refreshAccess).not.toHaveBeenCalled();
		expect(send).not.toHaveBeenCalled();
	});

	test('refreshes token and retries request on 401', async () => {
		const refreshAccess = vi.fn().mockResolvedValue(true);

		const jwt = new JWTManager({
			verifyAccess: vi.fn().mockResolvedValue(true),
			refreshAccess
		});

		const fetchToken = vi.fn().mockResolvedValue('new-csrf-token');

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken
		});

		const retryResponse = new Response(JSON.stringify({ success: true }), {
			status: 200
		});

		const send = vi.fn<typeof fetch>().mockResolvedValue(retryResponse);

		const onSessionExpired = vi.fn();

		const middleware = JWTMiddleware(jwt, csrf, {
			send,
			onSessionExpired
		});

		const request = new Request('http://api.test/items', {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				name: 'Widget'
			})
		});

		middleware.onRequest!(requestContext(request));

		const response = new Response(null, {
			status: 401
		});

		const result = await middleware.onResponse!(responseContext(response));

		expect(refreshAccess).toHaveBeenCalledOnce();
		expect(fetchToken).toHaveBeenCalledOnce();

		expect(send).toHaveBeenCalledOnce();

		const retriedRequest = send.mock.calls[0][0];

		expect(retriedRequest).toBeInstanceOf(Request);

		const retried = retriedRequest as Request;

		expect(retried.method).toBe('POST');

		expect(retried.headers.get('x-csrftoken')).toBe('new-csrf-token');

		expect(await retried.clone().json()).toEqual({
			name: 'Widget'
		});

		expect(result).toBe(retryResponse);

		expect(onSessionExpired).not.toHaveBeenCalled();
	});

	test('forces a new csrf token after jwt refresh', async () => {
		const jwt = new JWTManager({
			verifyAccess: vi.fn().mockResolvedValue(true),
			refreshAccess: vi.fn().mockResolvedValue(true)
		});

		const fetchToken = vi
			.fn()
			.mockResolvedValueOnce('old-token')
			.mockResolvedValueOnce('new-token');

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken
		});

		// Token that already existed before the 401
		await csrf.ensure();

		expect(csrf.get()).toBe('old-token');

		const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));

		const middleware = JWTMiddleware(jwt, csrf, {
			send
		});

		const request = new Request('http://api.test/items');

		middleware.onRequest!(requestContext(request));

		await middleware.onResponse!(responseContext(new Response(null, { status: 401 })));

		// One for the old token and one for ensure(true)
		expect(fetchToken).toHaveBeenCalledTimes(2);

		expect(csrf.get()).toBe('new-token');

		const retriedRequest = send.mock.calls[0][0] as Request;

		expect(retriedRequest.headers.get('x-csrftoken')).toBe('new-token');
	});

	test('expires session when refresh fails', async () => {
		const jwt = new JWTManager({
			verifyAccess: vi.fn().mockResolvedValue(false),
			refreshAccess: vi.fn().mockResolvedValue(false)
		});

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken: vi.fn().mockResolvedValue('token')
		});

		const send = vi.fn<typeof fetch>();
		const onSessionExpired = vi.fn();

		const middleware = JWTMiddleware(jwt, csrf, {
			send,
			onSessionExpired
		});

		const request = new Request('http://api.test/items');

		middleware.onRequest!(requestContext(request));

		const unauthorizedResponse = new Response(null, {
			status: 401
		});

		const result = await middleware.onResponse!(responseContext(unauthorizedResponse));

		expect(onSessionExpired).toHaveBeenCalledOnce();

		expect(send).not.toHaveBeenCalled();

		expect(result).toBe(unauthorizedResponse);
	});

	test('does not refresh jwt on 403', async () => {
		const refreshAccess = vi.fn().mockResolvedValue(true);

		const jwt = new JWTManager({
			verifyAccess: vi.fn().mockResolvedValue(true),
			refreshAccess
		});

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken: vi.fn().mockResolvedValue('token')
		});

		const send = vi.fn<typeof fetch>();

		const middleware = JWTMiddleware(jwt, csrf, {
			send
		});

		const request = new Request('http://api.test/items');

		middleware.onRequest!(requestContext(request));

		const forbiddenResponse = new Response(null, {
			status: 403
		});

		const result = await middleware.onResponse!(responseContext(forbiddenResponse));

		expect(refreshAccess).not.toHaveBeenCalled();
		expect(send).not.toHaveBeenCalled();

		expect(result).toBe(forbiddenResponse);
	});

	test('removes stored request on network error', async () => {
		const refreshAccess = vi.fn().mockResolvedValue(true);

		const jwt = new JWTManager({
			verifyAccess: vi.fn().mockResolvedValue(true),
			refreshAccess
		});

		const csrf = new CSRFManager({
			headerName: 'x-csrftoken',
			fetchToken: vi.fn().mockResolvedValue('token')
		});

		const send = vi.fn<typeof fetch>();

		const middleware = JWTMiddleware(jwt, csrf, {
			send
		});

		const request = new Request('http://api.test/items');

		middleware.onRequest!(requestContext(request));

		middleware.onError!({
			id: 'request-1',
			error: new Error('Network error')
		} as OnErrorContext);

		/*
		 * Reuse the same id after onError.
		 * onError dropped the stored Request,
		 * so the 401 must not trigger a refresh.
		 */
		const response = new Response(null, {
			status: 401
		});

		const result = await middleware.onResponse!(responseContext(response));

		expect(refreshAccess).not.toHaveBeenCalled();
		expect(send).not.toHaveBeenCalled();

		expect(result).toBe(response);
	});
});
