import { ResultAsync } from 'neverthrow';
import createClient, { type Client, type MaybeOptionalInit, type Middleware } from 'openapi-fetch';
import type { InitParam } from 'openapi-fetch/src/index.js';

import type { paths } from '@/shared/client/api-types';
import { toAppError } from '@/shared/models/app-error/app-error';

/** An openapi-fetch client bound to the endpoints in `api-types.d.ts` (generated from `openapi/schema.json`). */
export type PathClient = Client<paths, `${string}/${string}`>;

export type ClientConfiguration = {
	baseUrl: string;
	fetch: typeof fetch;
};

/** Creates a bare typed client. Useful when you need several clients with different middleware. */
export function makePathClient(config: ClientConfiguration) {
	return createClient<paths>({ ...config });
}

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

/** The paths of `P` that support HTTP method `M`. */
export type PathsWithMethod<P, M extends Method> = {
	[K in keyof P]: P[K] extends { [method in M]: infer Operation }
		? Operation extends never
			? never
			: K
		: never;
}[keyof P];

/**
 * Typed API client. Paths, params, bodies and responses are all checked
 * against the OpenAPI schema. Every call returns a `ResultAsync` instead of
 * throwing, so errors are values typed as `AppError`.
 *
 * ```ts
 * const result = await client.GET('/items/{id}', { params: { path: { id } } });
 * result.match(({ data }) => …, error => …);
 * ```
 */
export class APIClient {
	constructor(
		private readonly client: PathClient,
		middlewares: readonly Middleware[] = []
	) {
		for (const middleware of middlewares) {
			this.client.use(middleware);
		}
	}

	DO<M extends Method, P extends PathsWithMethod<paths, M>>(
		method: M,
		path: P,
		...options: InitParam<MaybeOptionalInit<paths[P], M>>
	) {
		return ResultAsync.fromPromise(this.client.request(method, path, ...options), toAppError);
	}

	GET<P extends PathsWithMethod<paths, 'get'>>(
		path: P,
		...options: InitParam<MaybeOptionalInit<paths[P], 'get'>>
	) {
		return this.DO('get', path, ...options);
	}

	POST<P extends PathsWithMethod<paths, 'post'>>(
		path: P,
		...options: InitParam<MaybeOptionalInit<paths[P], 'post'>>
	) {
		return this.DO('post', path, ...options);
	}

	PUT<P extends PathsWithMethod<paths, 'put'>>(
		path: P,
		...options: InitParam<MaybeOptionalInit<paths[P], 'put'>>
	) {
		return this.DO('put', path, ...options);
	}

	PATCH<P extends PathsWithMethod<paths, 'patch'>>(
		path: P,
		...options: InitParam<MaybeOptionalInit<paths[P], 'patch'>>
	) {
		return this.DO('patch', path, ...options);
	}

	DELETE<P extends PathsWithMethod<paths, 'delete'>>(
		path: P,
		...options: InitParam<MaybeOptionalInit<paths[P], 'delete'>>
	) {
		return this.DO('delete', path, ...options);
	}
}
