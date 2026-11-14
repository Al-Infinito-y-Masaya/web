import type { UseQueryResult } from '@tanstack/react-query';
import { useNavigate, type LinkOptions } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';

import type { PaginatedParams } from '@/shared/models/paginated-params/paginated-params';
import type { PaginatedResponse } from '@/shared/models/paginated-response/paginated-response';
import { Button } from '@/shared/ui/primitives/button';
import type { OtherQueryOptions } from '@/shared/utils/query/other-query-options';

import { DetailSheet, type DetailView } from '../detail/detail-sheet';
import { PAGE_SIZES, PaginatedTable, type Column } from './paginated-table';
import { TableFilters, type FilterValue, type TableFilter } from './table-filters';

/** Minimal service a table needs: any `makeCrudService` result fits. */
type ListSource<T, TParams> = {
	hooks: {
		useList: (query: TParams) => UseQueryResult<PaginatedResponse<T>, Error>;
		useDetail: (id: string, params?: OtherQueryOptions<T>) => UseQueryResult<T, Error>;
	};
};

/** Panel to create (no `row`) or edit (with `row`) a record. */
export type RowFormProps<T> = { row?: T; open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Everything that describes a resource's table. Each feature defines it in its
 * `table-view.tsx`; route pages only wire it up.
 */
export type TableView<T, TParams extends PaginatedParams> = {
	title: string;
	description?: string;
	/** Lowercase singular noun ("item"), used in "Item details" / "Edit item". */
	singular: string;
	/** Lowercase plural noun for counts ("items"). */
	itemLabel: string;
	searchPlaceholder?: string;
	/** `false` hides the search box when the backend does not support `search`. */
	searchable?: boolean;
	service: ListSource<T, TParams>;
	getRowId: (row: T) => string;
	columns: Column<T>[];
	filters?: TableFilter<TParams>[];
	/** Quick view opened when a row is clicked. */
	detail?: DetailView<T>;
	/** Page opened when a row is clicked (if there is no `detail`). */
	rowLink?: (row: T) => LinkOptions;
	/** Stable key to remember visible columns; enables the "Columns" menu. */
	columnsKey?: string;
	/** Note next to the count ("Sorted by last update"). */
	note?: ReactNode;
	/** Block shown when there are no rows. */
	empty?: (ctx: { search: string | null; clearSearch: () => void }) => ReactNode;
	/** Create/edit form. With it, rows and the quick view get an "Edit" action. */
	form?: ComponentType<RowFormProps<T>>;
	/** Extra actions at the end of each row (added to "Edit" when there is a form). */
	rowActions?: (row: T) => ReactNode;
};

export function defineTableView<T, TParams extends PaginatedParams>(view: TableView<T, TParams>) {
	return view;
}

/**
 * Table for a `TableView`, wired to its service and filters. Params are
 * controlled so the page decides where they live (URL search, local state…).
 */
export function QueryTable<T, TParams extends PaginatedParams>({
	view,
	params,
	onParamsChange
}: {
	view: TableView<T, TParams>;
	params: TParams;
	onParamsChange: (params: TParams) => void;
}) {
	const { data, isLoading, isFetching, error, refetch } = view.service.hooks.useList(params);
	const navigate = useNavigate();

	// Keep the row after closing so the exit animation still has content.
	const [selected, setSelected] = useState<T>();
	const [open, setOpen] = useState(false);
	const selectedId = selected ? view.getRowId(selected) : '';
	// The sheet shows the list row instantly (`detail.data ?? selected`)
	// and swaps in the backend detail when it arrives.
	const detail = view.service.hooks.useDetail(selectedId, { enabled: open && !!view.detail });
	const [editing, setEditing] = useState(false);
	const Form = view.form;
	// With a form, the quick-view footer adds "Edit" to its own actions.
	const detailView =
		view.detail && Form
			? {
					...view.detail,
					actions: (row: T) => (
						<>
							{view.detail!.actions?.(row)}
							<Button
								variant="outline"
								onClick={() => {
									setOpen(false);
									setEditing(true);
								}}
							>
								<Pencil />
								Edit
							</Button>
						</>
					)
				}
			: view.detail;

	return (
		<>
			<PaginatedTable
				columns={view.columns}
				data={data}
				getRowId={view.getRowId}
				params={params}
				onParamsChange={onParamsChange}
				isLoading={isLoading}
				isFetching={isFetching}
				error={error}
				onRetry={() => refetch()}
				itemLabel={view.itemLabel}
				searchPlaceholder={view.searchPlaceholder}
				searchable={view.searchable}
				toolbar={
					view.filters && (
						<TableFilters
							filters={view.filters}
							params={params}
							onParamsChange={onParamsChange}
						/>
					)
				}
				onRowClick={
					view.detail
						? row => {
								setSelected(row);
								setOpen(true);
							}
						: view.rowLink
							? row => navigate(view.rowLink!(row))
							: undefined
				}
				rowLabel={view.detail || view.rowLink ? () => `Open ${view.singular}` : undefined}
				rowActions={
					Form || view.rowActions
						? row => (
								<>
									{view.rowActions?.(row)}
									{Form && (
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Edit ${view.singular}`}
											title="Edit"
											onClick={() => {
												setSelected(row);
												setEditing(true);
											}}
										>
											<Pencil />
										</Button>
									)}
								</>
							)
						: undefined
				}
				columnsKey={view.columnsKey}
				note={view.note}
				empty={view.empty}
			/>
			{detailView && (
				<DetailSheet
					detail={detailView}
					eyebrow={`${view.singular[0]?.toUpperCase()}${view.singular.slice(1)} details`}
					row={detail.data ?? selected}
					open={open}
					onOpenChange={setOpen}
					isFetching={detail.isFetching}
					error={detail.error}
				/>
			)}
			{Form && (
				<Form row={detail.data ?? selected} open={editing} onOpenChange={setEditing} />
			)}
		</>
	);
}

/*
 * ============================================================================
 * Params <-> URL
 * ============================================================================
 */

/**
 * Reads a view's params from the URL search, dropping anything the view does
 * not declare: an `order` without a column, an unknown filter or a value
 * outside the fixed options never reaches the backend.
 */
export function paramsFromSearch<T, TParams extends PaginatedParams>(
	view: TableView<T, TParams>,
	search: Record<string, unknown>
): TParams {
	const sortKeys = view.columns.flatMap(c => (c.sortKey ? [c.sortKey, `-${c.sortKey}`] : []));
	const positiveInt = (v: unknown) =>
		typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined;
	const pageSize = positiveInt(search.page_size);

	const params: Record<string, unknown> = {
		page: positiveInt(search.page) ?? 1,
		page_size: pageSize && pageSize <= 100 ? pageSize : PAGE_SIZES[0],
		search: typeof search.search === 'string' && search.search ? search.search : null,
		order:
			typeof search.order === 'string' && sortKeys.includes(search.order)
				? search.order
				: null
	};

	for (const filter of view.filters ?? []) {
		const value = search[filter.param];
		const valid =
			filter.type === 'static'
				? filter.options.some(o => o.value === value)
				: typeof value === 'string' && value !== '';
		if (valid) params[filter.param] = value as FilterValue;
	}

	return params as TParams;
}

/** Inverse of `paramsFromSearch`: omits defaults and empty values for clean URLs. */
export function searchFromParams(
	params: PaginatedParams & Record<string, unknown>
): Record<string, unknown> {
	const search: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(params)) {
		if (value == null || value === '') continue;
		if (key === 'page' && value === 1) continue;
		if (key === 'page_size' && value === PAGE_SIZES[0]) continue;
		search[key] = value;
	}
	return search;
}
