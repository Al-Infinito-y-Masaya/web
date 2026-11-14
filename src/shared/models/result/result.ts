import { ResultAsync } from 'neverthrow';

import { AppException, toAppError, type AppError } from '@/shared/models/app-error/app-error';

/**
 * Wraps any promise that may reject into a `ResultAsync<T, AppError>`; the
 * rejection reason, whatever it is, is normalized with `toAppError`.
 *
 * Use it to compose several calls with `.andThen()` / `.map()` / `.mapErr()`
 * instead of nested try/catch:
 *
 * ```ts
 * toAppResult(fetchUser(id))
 *   .andThen(user => toAppResult(fetchTeam(user.teamId)))
 *   .mapErr(error => { console.warn(error.kind); return error; });
 * ```
 */
export function toAppResult<T>(promise: Promise<T>): ResultAsync<T, AppError> {
	return ResultAsync.fromPromise(promise, toAppError);
}

/**
 * Bridge back to the throwing world. TanStack Query treats any resolved
 * promise as success, so a `queryFn`/`mutationFn` must *throw* on failure:
 * on `Ok` this resolves with the value, on `Err` it throws an `AppException`.
 *
 * ```ts
 * useQuery({ queryKey: ['user', id], queryFn: () => unwrapOrThrow(userService.detail(id)) });
 * ```
 */
export function unwrapOrThrow<T>(result: ResultAsync<T, AppError>): Promise<T> {
	return result.match(
		value => value,
		error => {
			throw new AppException(error);
		}
	);
}
