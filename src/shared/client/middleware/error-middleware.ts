import { type Middleware } from 'openapi-fetch';

import { AppErrors, AppException, fromResponse } from '@/shared/models/app-error/app-error';

/**
 * Turns every non-2xx response and network failure into a thrown
 * `AppException`, which `APIClient` converts into an `Err(AppError)`.
 */
export const errorMiddleware: Middleware = {
	async onResponse({ response }) {
		if (response.ok) return response;
		const error = (await fromResponse(response)) ?? AppErrors.unknown();
		throw new AppException(error);
	},
	async onError({ error }) {
		throw new AppException(AppErrors.network(undefined, error));
	}
};
