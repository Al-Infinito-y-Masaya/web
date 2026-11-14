import type { Middleware } from 'openapi-fetch';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { errorMiddleware } from '@/shared/client/middleware/error-middleware';
import { AppError, AppErrors, AppException } from '@/shared/models/app-error/app-error';

type OnResponseContext = Parameters<NonNullable<Middleware['onResponse']>>[0];

type OnErrorContext = Parameters<NonNullable<Middleware['onError']>>[0];

function responseContext(response: Response): OnResponseContext {
	return {
		id: 'request-1',
		response
	} as OnResponseContext;
}

describe('errorMiddleware', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns successful response unchanged', async () => {
		const response = new Response(
			JSON.stringify({
				success: true
			}),
			{
				status: 200
			}
		);

		const result = await errorMiddleware.onResponse!(responseContext(response));

		expect(result).toBe(response);
	});

	test('throws APIError for backend error response', async () => {
		const backendError = {
			detail: 'Invalid data',
			field_errors: {
				name: ['Required']
			}
		};

		const response = Response.json(backendError, {
			status: 422
		});

		const promise = errorMiddleware.onResponse!(responseContext(response));

		await expect(promise).rejects.toBeInstanceOf(AppException);

		await expect(promise).rejects.toMatchObject(
			new AppException((await AppError.fromResponse(response)) ?? AppErrors.unknown())
		);
	});

	test('handles unknown json error format', async () => {
		const response = Response.json(
			{
				message: 'Something happened'
			},
			{
				status: 500
			}
		);

		const promise = errorMiddleware.onResponse!(responseContext(response));

		await expect(promise).rejects.toMatchObject(
			new AppException((await AppError.fromResponse(response)) ?? AppErrors.unknown())
		);
	});

	test('handles non-json error response', async () => {
		const response = new Response('Internal Server Error', {
			status: 500,
			statusText: 'Internal Server Error',
			headers: {
				'content-type': 'text/plain'
			}
		});

		const promise = errorMiddleware.onResponse!(responseContext(response));

		await expect(promise).rejects.toMatchObject(
			new AppException((await AppError.fromResponse(response)) ?? AppErrors.unknown())
		);
	});

	test('converts network errors to a network AppException', async () => {
		const promise = errorMiddleware.onError!({
			id: 'request-1',
			error: new TypeError('fetch failed')
		} as OnErrorContext);

		await expect(promise).rejects.toBeInstanceOf(AppException);

		await expect(promise).rejects.toMatchObject({
			error: { kind: 'network', message: AppErrors.network().message }
		});
	});

	test('uses generic message for unknown network error', async () => {
		const promise = errorMiddleware.onError!({
			id: 'request-1',
			error: 'unknown error'
		} as OnErrorContext);

		await expect(promise).rejects.toMatchObject({
			error: { kind: 'network', message: AppErrors.network().message }
		});
	});
});
