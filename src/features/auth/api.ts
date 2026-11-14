import { errAsync, okAsync } from 'neverthrow';

import { client } from '@/shared/client';
import type { RequestBody, Schema } from '@/shared/client/api-helpers';
import { AppErrors } from '@/shared/models/app-error/app-error';

export type User = Schema<'User'>;
export type Credentials = RequestBody<'/auth/login', 'post'>;

/**
 * Auth endpoints. The template assumes a cookie session: `/auth/login` sets an
 * HTTP-only cookie that the browser sends with every later request (see
 * `appFetch`). For bearer tokens, see docs/authentication.md.
 */
export const authApi = {
	login: (credentials: Credentials) =>
		client
			.POST('/auth/login', { body: credentials })
			.andThen(({ data }) => (data ? okAsync(data) : errAsync(AppErrors.empty()))),

	logout: () => client.POST('/auth/logout').map(() => undefined),

	/** The current user, or `null` when not signed in (401). */
	me: () =>
		client
			.GET('/auth/me')
			.map(({ data }): User | null => data ?? null)
			.orElse(error => (error.kind === 'unauthorized' ? okAsync(null) : errAsync(error)))
};
