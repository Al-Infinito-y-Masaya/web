import '@tanstack/react-query';

import type { AppException } from '@/shared/models/app-error/app-error';

declare module '@tanstack/react-query' {
	interface Register {
		/** Every query/mutation error is an `AppException` (see `unwrapOrThrow`). */
		defaultError: AppException;
	}
}
