import type { Middleware } from 'openapi-fetch';

import { env } from '@/config/env';

import { APIClient, makePathClient } from './api-client';
import { appFetch } from './fetch';
import { errorMiddleware } from './middleware/error-middleware';
import { logMiddleware } from './middleware/log-middleware';

/**
 * The application's API client.
 *
 * Middlewares run in registration order on requests and in reverse order on
 * responses, so `errorMiddleware` goes first to see the final response.
 *
 * Need auth? `./middleware` ships ready-made CSRF and JWT-refresh middlewares
 * (see docs/api-client.md for the wiring).
 */
const middlewares: Middleware[] = [errorMiddleware];

if (env.debug) middlewares.push(logMiddleware);

export const client = new APIClient(
	makePathClient({ baseUrl: env.apiUrl, fetch: appFetch }),
	middlewares
);

export default client;
