import type {
	QueryFunction,
	UseMutationOptions,
	UseMutationResult,
	UseQueryOptions,
	UseQueryResult
} from '@tanstack/react-query';
import type { ResultAsync } from 'neverthrow';

import type { AppError, AppException } from '@/shared/models/app-error/app-error';
import type { ID } from '@/shared/models/id';
import type {
	OmitPagingInformation,
	PaginatedParams
} from '@/shared/models/paginated-params/paginated-params';
import type { PaginatedResponse } from '@/shared/models/paginated-response/paginated-response';
import type { OtherQueryOptions } from '@/shared/utils/query/other-query-options';

/**
 * Generic parameters shared by every CRUD type:
 * - `T`        list row
 * - `TList`    list params (pagination, search, order, filters)
 * - `TCreate`  create payload
 * - `TUpdate`  update payload
 * - `TDetail`  detail shape (defaults to `T`)
 * - `TSummary` shape returned by `listAll` (defaults to `T`), e.g. for selects
 */

/**
 * What a resource has to implement: plain functions returning `ResultAsync`.
 * Usually written with the typed API client (see `src/features/items/api.ts`).
 */
export type CrudAdapter<
	T,
	TList extends PaginatedParams,
	TCreate,
	TUpdate,
	TDetail = T,
	TSummary = T
> = {
	list: (params: TList) => ResultAsync<PaginatedResponse<T>, AppError>;
	/** Every element matching the filters, without paging (for selects and filters). */
	listAll: (params: OmitPagingInformation<TList>) => ResultAsync<TSummary[], AppError>;
	detail: (id: ID) => ResultAsync<TDetail, AppError>;
	create: (payload: TCreate) => ResultAsync<TDetail, AppError>;
	update: (id: ID, payload: TUpdate) => ResultAsync<TDetail, AppError>;
	remove: (id: ID) => ResultAsync<void, AppError>;
};

export type UpdateVariables<TUpdate> = { id: ID; payload: TUpdate };

/** Query keys of a resource, for manual invalidation or prefetching. */
export type CrudKeys<TList extends PaginatedParams> = {
	all: readonly [string];
	lists: () => readonly unknown[];
	list: (params: TList) => readonly unknown[];
	listAll: (params: OmitPagingInformation<TList>) => readonly unknown[];
	details: () => readonly unknown[];
	detail: (id: ID) => readonly unknown[];
};

/** Query options with a real `queryFn` (no `skipToken`), so they also work with `useSuspenseQuery`. */
export type QueryOptionsWithFn<T> = UseQueryOptions<T, AppException> & {
	queryFn: QueryFunction<T>;
};

/** `queryOptions`/`mutationOptions` factories: use them in loaders, `useSuspenseQuery`, prefetching… */
export type CrudOptions<
	T,
	TList extends PaginatedParams,
	TCreate,
	TUpdate,
	TDetail = T,
	TSummary = T
> = {
	list: (
		params: TList,
		options?: OtherQueryOptions<PaginatedResponse<T>>
	) => QueryOptionsWithFn<PaginatedResponse<T>>;
	listAll: (
		params: OmitPagingInformation<TList>,
		options?: OtherQueryOptions<TSummary[]>
	) => QueryOptionsWithFn<TSummary[]>;
	detail: (id: ID, options?: OtherQueryOptions<TDetail>) => QueryOptionsWithFn<TDetail>;
	create: () => UseMutationOptions<TDetail, AppException, TCreate>;
	update: () => UseMutationOptions<TDetail, AppException, UpdateVariables<TUpdate>>;
	remove: () => UseMutationOptions<void, AppException, ID>;
};

export type CrudHooks<
	T,
	TList extends PaginatedParams,
	TCreate,
	TUpdate,
	TDetail = T,
	TSummary = T
> = {
	useList: (
		params: TList,
		options?: OtherQueryOptions<PaginatedResponse<T>>
	) => UseQueryResult<PaginatedResponse<T>, AppException>;
	useListAll: (
		params: OmitPagingInformation<TList>,
		options?: OtherQueryOptions<TSummary[]>
	) => UseQueryResult<TSummary[], AppException>;
	useDetail: (
		id: ID,
		options?: OtherQueryOptions<TDetail>
	) => UseQueryResult<TDetail, AppException>;
	useCreate: () => UseMutationResult<TDetail, AppException, TCreate>;
	useUpdate: () => UseMutationResult<TDetail, AppException, UpdateVariables<TUpdate>>;
	useRemove: () => UseMutationResult<void, AppException, ID>;
};

export type CrudService<
	T,
	TList extends PaginatedParams,
	TCreate,
	TUpdate,
	TDetail = T,
	TSummary = T
> = {
	name: string;
	keys: CrudKeys<TList>;
	/** The raw adapter functions (no caching), for scripts or composition. */
	api: CrudAdapter<T, TList, TCreate, TUpdate, TDetail, TSummary>;
	options: CrudOptions<T, TList, TCreate, TUpdate, TDetail, TSummary>;
	hooks: CrudHooks<T, TList, TCreate, TUpdate, TDetail, TSummary>;
};
