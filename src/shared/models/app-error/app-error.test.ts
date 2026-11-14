import { describe, expect, test } from 'vitest';

import {
	AppError,
	AppErrors,
	AppException,
	assertUnreachableAppError,
	fromResponse,
	isAppError,
	type HttpAppError
} from './app-error';

describe('AppErrors factories', () => {
	test('network', () => {
		expect(AppErrors.network()).toEqual({
			kind: 'network',
			message: 'Could not connect to the server',
			cause: undefined
		});
	});

	test('http', () => {
		expect(AppErrors.http(500, 'Internal error', 'server_error')).toEqual({
			kind: 'http',
			status: 500,
			message: 'Internal error',
			code: 'server_error',
			cause: undefined
		});
	});

	test('unauthorized defaults status to 401', () => {
		expect(AppErrors.unauthorized().status).toBe(401);
	});

	test('forbidden defaults status to 403', () => {
		expect(AppErrors.forbidden().status).toBe(403);
	});

	test('notFound defaults status to 404', () => {
		expect(AppErrors.notFound().status).toBe(404);
	});

	test('validation carries fieldErrors', () => {
		const error = AppErrors.validation({ username: 'Required' });
		expect(error.kind).toBe('validation');
		expect(error.fieldErrors).toEqual({ username: 'Required' });
	});
});

describe('isAppError', () => {
	test('recognizes an AppError', () => {
		expect(isAppError(AppErrors.empty())).toBe(true);
	});

	test('rejects a plain Error', () => {
		expect(isAppError(new Error('boom'))).toBe(false);
	});

	test('rejects a string', () => {
		expect(isAppError('boom')).toBe(false);
	});
});

describe('fromResponse', () => {
	test('converts a response error to an AppError', async () => {
		const body = JSON.stringify({
			detail: 'Internal error',
			field_errors: {}
		});
		const result = (await fromResponse(new Response(body, { status: 500 })))!;

		expect(result).toBeDefined();
		expect(isAppError(result)).toBe(true);
		expect(result.kind).toBe('http');
		if (result.kind === 'http') {
			expect(result.status).toBe(500);
			expect(result.message).toBe('Internal error');
		}
	});

	test("doesn't convert a successful response to an AppError", async () => {
		const result = await fromResponse(new Response('success', { status: 200 }));

		expect(result).toBeUndefined();
		expect(isAppError(result)).toBe(false);
	});

	test('converts a validation error to an AppError', async () => {
		const body = JSON.stringify({
			detail: 'Validation error',
			field_errors: {
				username: 'Username is required'
			}
		});
		const result = (await fromResponse(new Response(body, { status: 400 })))!;

		expect(result).toBeDefined();
		expect(isAppError(result)).toBe(true);
		expect(result.kind).toBe('validation');
		if (result.kind === 'validation') {
			expect(result.message).toBe('Validation error');
			expect(result.fieldErrors).toEqual({
				username: 'Username is required'
			});
		}
	});

	test('unauthorized', async () => {
		const body = JSON.stringify({ detail: 'Not allowed' });
		const error = (await fromResponse(new Response(body, { status: 401 })))!;
		expect(error).toBeDefined();
		expect(isAppError(error)).toBe(true);
		expect(error.kind).toBe('unauthorized');
	});

	test('forbidden', async () => {
		const body = JSON.stringify({ detail: 'Not allowed' });
		const error = (await fromResponse(new Response(body, { status: 403 })))!;
		expect(error).toBeDefined();
		expect(isAppError(error)).toBe(true);
		expect(error.kind).toBe('forbidden');
	});

	test('not-found', async () => {
		const body = JSON.stringify({ detail: 'Not found' });
		const error = (await fromResponse(new Response(body, { status: 404 })))!;
		expect(error).toBeDefined();
		expect(isAppError(error)).toBe(true);
		expect(error.kind).toBe('notFound');
	});

	test('no-detail', async () => {
		const body = JSON.stringify({});
		const error = (await fromResponse(new Response(body, { status: 500 })))!;
		expect(error).toBeDefined();
		expect(isAppError(error)).toBe(true);
		expect(error.kind).toBe('http');
		expect((error as HttpAppError).status).toBe(500);
	});
});

test('AppError kind switch is exhaustive at compile time', () => {
	function describeKind(error: AppError): string {
		switch (error.kind) {
			case 'network':
				return 'network';
			case 'http':
				return 'http';
			case 'unauthorized':
				return 'unauthorized';
			case 'forbidden':
				return 'forbidden';
			case 'notFound':
				return 'notFound';
			case 'validation':
				return 'validation';
			case 'parse':
				return 'parse';
			case 'empty':
				return 'empty';
			case 'custom':
				return 'custom';
			case 'unknown':
				return 'unknown';
			default:
				return assertUnreachableAppError(error);
		}
	}

	expect(describeKind(AppErrors.parse())).toBe('parse');
});

describe('AppException', () => {
	test('is an instance of Error (compatible with TanStack Query TError)', () => {
		const exception = new AppException(AppErrors.notFound());

		expect(exception).toBeInstanceOf(Error);
		expect(exception.message).toBe('The requested resource does not exist');
		expect(exception.error.kind).toBe('notFound');
	});
});

describe('AppError.makeFrom', () => {
	test('passes an AppError through unchanged', () => {
		const error = AppErrors.empty();
		expect(AppError.makeFrom(error)).toBe(error);
	});

	test('unwraps an AppException back to its AppError', () => {
		const error = AppErrors.forbidden();
		expect(AppError.makeFrom(new AppException(error))).toBe(error);
	});

	test('falls back to an custom error for a generic Error', () => {
		const result = AppError.makeFrom(new TypeError('something odd happened'));
		expect(result).toMatchObject({
			kind: 'custom',
			message: 'something odd happened'
		});
	});

	test('falls back to an unknown error for a totally unknown value', () => {
		const result = AppError.makeFrom('boom');
		expect(result).toMatchObject({
			kind: 'unknown',
			message: 'Unknown error'
		});
	});
});
