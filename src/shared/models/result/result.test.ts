import { describe, expect, test } from 'vitest';

import { AppException, type AppError } from '@/shared/models/app-error/app-error';

import { toAppResult, unwrapOrThrow } from './result';

describe('toResult', () => {
	test('a resolved promise becomes Ok', async () => {
		const result = await toAppResult(Promise.resolve({ id: 1 }));

		expect(result.isOk()).toBe(true);
		expect(result._unsafeUnwrap()).toEqual({ id: 1 });
	});

	test('a promise rejected with AppError becomes Err(AppError)', async () => {
		const apiError: AppError = {
			kind: 'notFound',
			message: 'Not found',
			status: 404
		};

		const result = await toAppResult(Promise.reject(apiError));

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toMatchObject({
			kind: 'notFound',
			message: 'Not found'
		});
	});

	test('a promise rejected with a network APIError (status 0) becomes Err(network)', async () => {
		const apiError: AppError = {
			kind: 'network',
			message: 'Connection error'
		};

		const result = await toAppResult(Promise.reject(apiError));

		expect(result._unsafeUnwrapErr().kind).toBe('network');
	});

	test('a promise rejected with a generic Error becomes Err(custom)', async () => {
		const result = await toAppResult(Promise.reject(new TypeError('boom')));

		expect(result._unsafeUnwrapErr()).toMatchObject({
			kind: 'custom',
			message: 'boom'
		});
	});
});

describe('unwrapForQuery', () => {
	test('resolves with the value on Ok, like a normal queryFn', async () => {
		const value = await unwrapOrThrow(toAppResult(Promise.resolve({ id: 1 })));

		expect(value).toEqual({ id: 1 });
	});

	test('throws an AppException on Err, so TanStack Query still sees a rejection', async () => {
		const apiError: AppError = {
			kind: 'forbidden',
			status: 403,
			message: 'Not allowed'
		};

		const promise = unwrapOrThrow(toAppResult(Promise.reject(apiError)));

		await expect(promise).rejects.toBeInstanceOf(AppException);
		await expect(promise).rejects.toBeInstanceOf(Error);
		await expect(promise).rejects.toMatchObject({
			message: 'Not allowed',
			error: { kind: 'forbidden', status: 403 }
		});
	});
});
