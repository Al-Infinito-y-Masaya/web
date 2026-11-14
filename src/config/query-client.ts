import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { AppException } from '@/shared/models/app-error/app-error';
import { eventBus, events } from '@/shared/utils/events';

/** Errors that will not go away by retrying. */
const NON_RETRYABLE = new Set(['unauthorized', 'forbidden', 'notFound', 'validation', 'parse']);

/** Any 401 outside the session check itself means the session is gone. */
function onError(error: unknown, key?: readonly unknown[]) {
	const isSessionQuery = key?.[0] === 'auth';
	if (error instanceof AppException && error.error.kind === 'unauthorized' && !isSessionQuery) {
		eventBus.dispatch(events.sessionExpired);
	}
}

export function createQueryClient() {
	return new QueryClient({
		queryCache: new QueryCache({ onError: (error, query) => onError(error, query.queryKey) }),
		mutationCache: new MutationCache({ onError: error => onError(error) }),
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				refetchOnWindowFocus: false,
				retry: (failureCount, error) => {
					if (error instanceof AppException && NON_RETRYABLE.has(error.error.kind))
						return false;
					return failureCount < 2;
				}
			},
			mutations: {
				retry: false
			}
		}
	});
}
