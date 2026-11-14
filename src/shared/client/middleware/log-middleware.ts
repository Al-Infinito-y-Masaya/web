import { type Middleware } from 'openapi-fetch';

/** Logs every request and response. Enabled with `VITE_DEBUG=true`. */
export const logMiddleware: Middleware = {
	onRequest({ request }) {
		const url = new URL(request.url);
		console.log(`${request.method} Request to: ${url.pathname}`);
		if (url.searchParams.size > 0) {
			console.log('Query Params:', Object.fromEntries(url.searchParams.entries()));
		}
		return request;
	},
	onResponse({ schemaPath, response }) {
		console.log(
			`Received response: ${JSON.stringify(response)} (status ${response.status}) from path ${schemaPath}`
		);
		return response;
	}
};
