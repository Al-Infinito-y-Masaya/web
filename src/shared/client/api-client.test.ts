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

		const expected = {
			data: {
				results: []
			}
		};

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const result = await client.GET('/items');

		expect(request).toHaveBeenCalledOnce();

		expect(request).toHaveBeenCalledWith('get', '/items');

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('POST delegates body to path client', async () => {
		const { pathClient, request } = makeClient();

		const expected = {
			data: {
				id: '550e8400-e29b-41d4-a716-446655440000',
				name: 'Widget',
				status: 'draft',
				quantity: 1
			}
		};

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const result = await client.POST('/items', {
			body: {
				name: 'Widget',
				status: 'draft',
				quantity: 1
			}
		});

		expect(request).toHaveBeenCalledWith('post', '/items', {
			body: {
				name: 'Widget',
				status: 'draft',
				quantity: 1
			}
		});

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('PATCH delegates path params and body', async () => {
		const { pathClient, request } = makeClient();

		const expected = {
			data: {
				id: '550e8400-e29b-41d4-a716-446655440000',
				name: 'Gadget'
			}
		};

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const result = await client.PATCH('/items/{id}', {
			params: {
				path: {
					id: '550e8400-e29b-41d4-a716-446655440000'
				}
			},
			body: {
				name: 'Gadget'
			}
		});

		expect(request).toHaveBeenCalledWith('patch', '/items/{id}', {
			params: {
				path: {
					id: '550e8400-e29b-41d4-a716-446655440000'
				}
			},
			body: {
				name: 'Gadget'
			}
		});

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	test('DELETE delegates path params', async () => {
		const { pathClient, request } = makeClient();

		const expected = {
			data: undefined
		};

		request.mockResolvedValue(expected);

		const client = new APIClient(pathClient);

		const result = await client.DELETE('/items/{id}', {
			params: {
				path: {
					id: '550e8400-e29b-41d4-a716-446655440000'
				}
			}
		});

		expect(request).toHaveBeenCalledWith('delete', '/items/{id}', {
			params: {
				path: {
					id: '550e8400-e29b-41d4-a716-446655440000'
				}
			}
		});

		expect(result._unsafeUnwrap()).toBe(expected);
	});

	// test('PUT delegates path params and body', async () => {
	//     const { pathClient, request } = makeClient();

	//     request.mockResolvedValue({
	//         data: {}
	//     });

	//     const client = new APIClient(pathClient);

	//     await client.PATCH('/auth/user/{id}/', {
	//         params: {
	//             path: {
	//                 id: '550e8400-e29b-41d4-a716-446655440000'
	//             }
	//         },
	//         body: {
	//             username: 'testuser'
	//         }
	//     });

	//     expect(request).toHaveBeenCalledWith('patch', '/auth/user/{id}/', {
	//         params: {
	//             path: {
	//                 id: '550e8400-e29b-41d4-a716-446655440000'
	//             }
	//         },
	//         body: {
	//             username: 'testuser'
	//         }
	//     });
	// });
});
