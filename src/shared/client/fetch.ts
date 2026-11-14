import fetchBuilder from 'fetch-retry';

// Resolve `globalThis.fetch` on every call so tests can stub it.
const dynamicFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

/** Retries network failures (not HTTP errors) with exponential backoff: 100ms, 200ms, 400ms. */
const retryFetch = fetchBuilder(dynamicFetch, {
	retries: 3,
	retryDelay: attempt => 2 ** attempt * 100
});

/**
 * `fetch` used by the API client: retries network failures and sends cookies
 * by default. Change `credentials` to `'same-origin'` if your API does not use
 * cookie authentication.
 */
export const appFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
	retryFetch(input, {
		...init,
		credentials: init?.credentials ?? 'include'
	})) as typeof fetch;
