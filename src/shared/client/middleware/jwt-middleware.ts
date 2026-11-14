import { type Middleware } from 'openapi-fetch';

import { type CSRFManager } from '@/shared/client/managers/csrf-manager';
import { type JWTManager } from '@/shared/client/managers/jwt-manager';

interface JWTMiddlewareOptions {
	/** `fetch` used to replay the original request after a refresh. */
	send: typeof fetch;
	/** Called when the refresh fails: sign the user out here. */
	onSessionExpired?: () => void;
}

/**
 * On a 401, refreshes the access token once and replays the original request.
 * Meant for HTTP-only cookie JWTs; a 403 is left alone (it means "not
 * allowed", not "not authenticated").
 */
export function JWTMiddleware(
	jwt: JWTManager,
	csrf: CSRFManager,
	options: JWTMiddlewareOptions
): Middleware {
	const replayRequests = new Map<string, Request>();

	return {
		onRequest({ id, request }) {
			// Keep a copy before fetch consumes the body.
			replayRequests.set(id, request.clone());
		},

		async onResponse({ id, response }) {
			const originalRequest = replayRequests.get(id);
			replayRequests.delete(id);

			if (response.status !== 401 || !originalRequest) return response;

			const refreshed = await jwt.refresh();
			if (!refreshed) {
				options.onSessionExpired?.();
				return response;
			}

			// The refresh may have rotated session cookies: fetch a fresh CSRF token.
			await csrf.ensure(true);
			return options.send(csrf.inject(originalRequest));
		},

		onError({ id }) {
			replayRequests.delete(id);
		}
	};
}
