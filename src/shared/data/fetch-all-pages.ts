import { errAsync, okAsync, type ResultAsync } from 'neverthrow';

import { AppErrors, type AppError } from '@/shared/models/app-error/app-error';
import type { PaginatedResponse } from '@/shared/models/paginated-response/paginated-response';

/**
 * Walks every page of a paginated endpoint and concatenates the results.
 * Used to implement `listAll` on top of `list`.
 */
export function fetchAllPages<T>(
	fetchPage: (page: number, pageSize: number) => ResultAsync<PaginatedResponse<T>, AppError>,
	{ pageSize = 100, maxPages = 100 } = {}
): ResultAsync<T[], AppError> {
	const step = (page: number, acc: T[]): ResultAsync<T[], AppError> =>
		fetchPage(page, pageSize).andThen(res => {
			const all = acc.concat(res.results);
			if (!res.next) return okAsync(all);
			if (page >= maxPages) return errAsync(AppErrors.custom(`More than ${maxPages} pages`));
			return step(page + 1, all);
		});
	return step(1, []);
}
