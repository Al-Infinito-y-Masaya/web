import type { UseQueryOptions } from '@tanstack/react-query';

import type { AppException } from '@/shared/models/app-error/app-error';

/** Extra options a caller may pass to a query factory (everything but key and fn). */
export type OtherQueryOptions<T> = Omit<UseQueryOptions<T, AppException>, 'queryKey' | 'queryFn'>;
