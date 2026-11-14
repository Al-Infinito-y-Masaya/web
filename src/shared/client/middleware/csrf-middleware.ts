import { type Middleware } from 'openapi-fetch';

import { type CSRFManager } from '@/shared/client/managers/csrf-manager';

/** Adds the CSRF header to every request, fetching the token first if needed. */
export function CSRFMiddleware(csrf: CSRFManager): Middleware {
	return {
		async onRequest({ request }) {
			await csrf.ensure();
			return csrf.inject(request);
		}
	};
}
