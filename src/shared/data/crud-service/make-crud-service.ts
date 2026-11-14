import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppException } from '@/shared/models/app-error/app-error';
import type { ID } from '@/shared/models/id';
import type {
	OmitPagingInformation,
	PaginatedParams
} from '@/shared/models/paginated-params/paginated-params';
import { unwrapOrThrow } from '@/shared/models/result/result';

import type {
	CrudAdapter,
	CrudKeys,
	CrudOptions,
	CrudService,
	UpdateVariables
} from './crud-service';

/**
 * Builds a full TanStack Query layer for a REST resource from an adapter:
 * consistent query keys, query/mutation options and hooks, with cache
 * invalidation after every mutation.
 *
 * ```ts
 * export const itemService = makeCrudService({ name: 'items', adapter: itemsApi });
 *
 * const { data } = itemService.hooks.useList({ page: 1 });
 * const create = itemService.hooks.useCreate();
 * ```
 */
export function makeCrudService<
	T,
	TList extends PaginatedParams,
	TCreate,
	TUpdate,
	TDetail = T,
	TSummary = T
>(config: {
	/** Unique name; the root of every query key of this resource. */
	name: string;
	adapter: CrudAdapter<T, TList, TCreate, TUpdate, TDetail, TSummary>;
}): CrudService<T, TList, TCreate, TUpdate, TDetail, TSummary> {
	const { name, adapter } = config;

	const keys: CrudKeys<TList> = {
		all: [name] as const,
		lists: () => [name, 'list'],
		list: params => [name, 'list', params],
		listAll: params => [name, 'list', 'all', params],
		details: () => [name, 'detail'],
		detail: id => [name, 'detail', id]
	};

	// Mutation options need the QueryClient; the hooks pass it in.
	const mutationOptions = (client: ReturnType<typeof useQueryClient>) => ({
		create: {
			mutationFn: (payload: TCreate) => unwrapOrThrow(adapter.create(payload)),
			onSuccess: () => client.invalidateQueries({ queryKey: keys.lists() })
		},
		update: {
			mutationFn: ({ id, payload }: UpdateVariables<TUpdate>) =>
				unwrapOrThrow(adapter.update(id, payload)),
			onSuccess: (data: TDetail, { id }: UpdateVariables<TUpdate>) => {
				client.setQueryData(keys.detail(id), data);
				return client.invalidateQueries({ queryKey: keys.lists() });
			}
		},
		remove: {
			mutationFn: (id: ID) => unwrapOrThrow(adapter.remove(id)),
			onSuccess: (_: void, id: ID) => {
				client.removeQueries({ queryKey: keys.detail(id) });
				return client.invalidateQueries({ queryKey: keys.lists() });
			}
		}
	});

	const options: CrudOptions<T, TList, TCreate, TUpdate, TDetail, TSummary> = {
		list: (params, extra) => ({
			queryKey: keys.list(params),
			queryFn: () => unwrapOrThrow(adapter.list(params)),
			placeholderData: keepPreviousData,
			...extra
		}),
		listAll: (params: OmitPagingInformation<TList>, extra) => ({
			queryKey: keys.listAll(params),
			queryFn: () => unwrapOrThrow(adapter.listAll(params)),
			...extra
		}),
		detail: (id, extra) => ({
			queryKey: keys.detail(id),
			queryFn: () => unwrapOrThrow(adapter.detail(id)),
			enabled: !!id,
			...extra
		}),
		// Without a client these only carry the mutationFn; use the hooks for invalidation.
		create: () => ({ mutationFn: payload => unwrapOrThrow(adapter.create(payload)) }),
		update: () => ({
			mutationFn: ({ id, payload }) => unwrapOrThrow(adapter.update(id, payload))
		}),
		remove: () => ({ mutationFn: id => unwrapOrThrow(adapter.remove(id)) })
	};

	return {
		name,
		keys,
		api: adapter,
		options,
		hooks: {
			useList: (params, extra) => useQuery(options.list(params, extra)),
			useListAll: (params, extra) => useQuery(options.listAll(params, extra)),
			useDetail: (id, extra) => useQuery(options.detail(id, extra)),
			useCreate: () => {
				const client = useQueryClient();
				return useMutation<TDetail, AppException, TCreate>(mutationOptions(client).create);
			},
			useUpdate: () => {
				const client = useQueryClient();
				return useMutation<TDetail, AppException, UpdateVariables<TUpdate>>(
					mutationOptions(client).update
				);
			},
			useRemove: () => {
				const client = useQueryClient();
				return useMutation<void, AppException, ID>(mutationOptions(client).remove);
			}
		}
	};
}
