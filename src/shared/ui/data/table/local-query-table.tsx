import {
	keepPreviousData,
	useQuery,
	type DefaultError,
	type QueryKey,
	type UseQueryOptions
} from '@tanstack/react-query';
import { useState, type ComponentProps } from 'react';

import type { PaginatedParams } from '@/shared/models/paginated-params/paginated-params';
import type { PaginatedResponse } from '@/shared/models/paginated-response/paginated-response';

import { PAGE_SIZES, PaginatedTable } from './paginated-table';
import { TableFilters, type TableFilter } from './table-filters';

type TableProps<T, P extends PaginatedParams> = Omit<
	ComponentProps<typeof PaginatedTable<T, P>>,
	'data' | 'params' | 'onParamsChange' | 'isLoading' | 'isFetching' | 'error' | 'toolbar'
>;

/**
 * Paginated table with params in local state, for secondary lists inside
 * another page (e.g. a user's orders on the user page). Takes a
 * `queryOptions` factory instead of a service, so it fits any filtered read.
 */
export function LocalQueryTable<T, P extends PaginatedParams, TKey extends QueryKey = QueryKey>({
	query,
	initialParams,
	filters,
	...table
}: TableProps<T, P> & {
	query: (
		params: P
	) => UseQueryOptions<PaginatedResponse<T>, DefaultError, PaginatedResponse<T>, TKey>;
	initialParams?: Partial<P>;
	filters?: TableFilter<P>[];
}) {
	const [params, setParams] = useState<P>({
		page: 1,
		page_size: PAGE_SIZES[0],
		...initialParams
	} as P);
	const { data, isLoading, isFetching, error, refetch } = useQuery({
		...query(params),
		placeholderData: keepPreviousData
	});

	return (
		<PaginatedTable
			{...table}
			data={data}
			params={params}
			onParamsChange={setParams}
			isLoading={isLoading}
			isFetching={isFetching}
			error={error}
			onRetry={() => refetch()}
			toolbar={
				filters && (
					<TableFilters filters={filters} params={params} onParamsChange={setParams} />
				)
			}
		/>
	);
}
