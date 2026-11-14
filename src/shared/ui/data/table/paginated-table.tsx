import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsUpDown,
	ChevronUp,
	Columns3,
	FileX,
	RotateCw,
	Search,
	SearchX,
	X
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { appConfig } from '@/config/app';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { PaginatedParams } from '@/shared/models/paginated-params/paginated-params';
import type { PaginatedResponse } from '@/shared/models/paginated-response/paginated-response';
import { Button } from '@/shared/ui/primitives/button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/shared/ui/primitives/dropdown-menu';
import { Input } from '@/shared/ui/primitives/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/ui/primitives/select';
import { Skeleton } from '@/shared/ui/primitives/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/shared/ui/primitives/table';
import { cn } from '@/shared/utils';

export type Column<T> = {
	/** Unique column id. */
	id: string;
	label: string;
	/** `order` value sent to the backend (`-` + sortKey for descending). Without it the column is not sortable. */
	sortKey?: string;
	render: (row: T) => ReactNode;
	className?: string;
	/** Right-align numbers. */
	align?: 'right';
	/** Hidden until enabled from the "Columns" menu. */
	defaultHidden?: boolean;
	/** `false` = always visible (e.g. the name). Hideable by default. */
	hideable?: boolean;
};

export function defineColumns<T>(columns: Column<T>[]) {
	return columns;
}

export const PAGE_SIZES = [10, 25, 50, 100] as const;

const numberFormat = new Intl.NumberFormat(appConfig.locale);

type PaginatedTableProps<T, TParams extends PaginatedParams> = {
	columns: Column<T>[];
	data: PaginatedResponse<T> | undefined;
	getRowId: (row: T) => string;
	params: TParams;
	onParamsChange: (params: TParams) => void;
	/** First load, nothing to show yet. */
	isLoading?: boolean;
	/** Refetching with previous data on screen (page change, search…). */
	isFetching?: boolean;
	error?: Error | null;
	/** Plural noun used in counts: "1,284 items". */
	itemLabel?: string;
	searchPlaceholder?: string;
	/** `false` when the endpoint does not support `search`. */
	searchable?: boolean;
	/** Filters or other controls next to the search box. */
	toolbar?: ReactNode;
	/** Note next to the count, e.g. how rows are sorted. */
	note?: ReactNode;
	/** Actions at the end of each row. */
	rowActions?: (row: T) => ReactNode;
	onRowClick?: (row: T) => void;
	/** Accessible name of a clickable row. */
	rowLabel?: (row: T) => string;
	/**
	 * Enables the "Columns" menu and remembers the choice in this browser under
	 * this key. Without it every column is always shown.
	 */
	columnsKey?: string;
	/** Replaces the table when there are no rows at all (and no search/filters). */
	empty?: (ctx: { search: string | null; clearSearch: () => void }) => ReactNode;
	/** Refetches after a load error. */
	onRetry?: () => void;
};

/** Params that are not filters: paging, search and order. */
const NOT_FILTERS = new Set(['page', 'page_size', 'search', 'order']);

export function PaginatedTable<T, TParams extends PaginatedParams>({
	columns: allColumns,
	data,
	getRowId,
	params,
	onParamsChange,
	isLoading = false,
	isFetching = false,
	error,
	itemLabel = 'records',
	searchPlaceholder = 'Search…',
	searchable = true,
	toolbar,
	note,
	rowActions,
	onRowClick,
	rowLabel,
	columnsKey,
	empty,
	onRetry
}: PaginatedTableProps<T, TParams>) {
	const [hidden, setHidden] = useColumnVisibility(columnsKey, allColumns);
	const columns = allColumns.filter(c => !hidden.has(c.id));
	const rows = data?.results ?? [];
	const page = data?.current ?? params.page ?? 1;
	const pageSize = params.page_size ?? PAGE_SIZES[0];
	const total = data?.elements ?? 0;
	const pages = Math.max(data?.pages ?? 1, 1);
	const colSpan = columns.length + (rowActions ? 1 : 0);

	const setParams = (patch: Partial<TParams>) => onParamsChange({ ...params, ...patch });
	const activeFilters = Object.entries(params)
		.filter(([k, v]) => !NOT_FILTERS.has(k) && v != null && v !== '')
		.map(([k]) => k);
	const clearFilters = () =>
		setParams({
			...Object.fromEntries(activeFilters.map(k => [k, null])),
			page: 1
		} as Partial<TParams>);
	const filtered = activeFilters.length > 0 || !!params.search;

	const [search, setSearch] = useState(params.search ?? '');
	const debouncedSearch = useDebouncedValue(search.trim(), 300);
	useEffect(() => {
		const next = debouncedSearch || null;
		if (next !== (params.search ?? null))
			setParams({ search: next, page: 1 } as Partial<TParams>);
		// Only react to the debounced text.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearch]);

	const toggleSort = (key: string) => {
		const order = params.order === key ? `-${key}` : params.order === `-${key}` ? null : key;
		setParams({ order, page: 1 } as Partial<TParams>);
	};

	const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
	const to = (page - 1) * pageSize + rows.length;

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				{searchable && (
					<div className="relative w-full sm:w-80">
						<Search
							aria-hidden
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="search"
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder={searchPlaceholder}
							aria-label={searchPlaceholder}
							className="h-10 bg-card pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch('')}
								aria-label="Clear search"
								className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
							>
								<X className="size-4" />
							</button>
						)}
					</div>
				)}
				{toolbar}
				{columnsKey && (
					<div className="ml-auto">
						<ColumnsMenu columns={allColumns} hidden={hidden} onChange={setHidden} />
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
				<p className="text-sm font-semibold">
					{isLoading ? 'Loading…' : `${numberFormat.format(total)} ${itemLabel}`}
				</p>
				{note && <p className="text-xs text-muted-foreground">{note}</p>}
			</div>

			{empty && !filtered && !isLoading && !error && rows.length === 0 ? (
				<div className="rounded-xl border bg-card">
					{empty({ search: params.search ?? null, clearSearch: () => setSearch('') })}
				</div>
			) : (
				<div className="relative overflow-hidden rounded-xl border bg-card">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/60 hover:bg-muted/60">
								{columns.map(column => (
									<TableHead
										key={column.id}
										className={cn(
											column.align === 'right' && 'text-right',
											column.className
										)}
										aria-sort={ariaSort(params.order, column.sortKey)}
									>
										{column.sortKey ? (
											<SortButton
												column={column}
												order={params.order}
												onClick={() => toggleSort(column.sortKey!)}
											/>
										) : (
											column.label
										)}
									</TableHead>
								))}
								{rowActions && (
									<TableHead className="w-12">
										<span className="sr-only">Actions</span>
									</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody
							className={cn(
								'transition-opacity',
								isFetching && !isLoading && 'opacity-60'
							)}
						>
							{isLoading ? (
								// Skeleton rows shaped like the table while the first page loads.
								Array.from({ length: Math.min(pageSize, 8) }, (_, r) => (
									<TableRow key={r} className="hover:bg-transparent" aria-hidden>
										{columns.map((column, c) => (
											<TableCell key={column.id} className={column.className}>
												<Skeleton
													className={cn(
														'h-3.5',
														c === 0 ? 'w-40' : r % 2 ? 'w-20' : 'w-28',
														column.align === 'right' && 'ml-auto w-12'
													)}
												/>
											</TableCell>
										))}
										{rowActions && <TableCell className="w-12" />}
									</TableRow>
								))
							) : error ? (
								<TableRow className="hover:bg-transparent">
									<TableCell colSpan={colSpan} className="h-40 text-center">
										<div
											role="alert"
											className="flex flex-col items-center gap-3"
										>
											<p className="text-sm font-semibold">
												Could not load {itemLabel}
											</p>
											<p className="text-[13px] text-muted-foreground">
												{error.message ||
													'Check your connection and try again.'}
											</p>
											{onRetry && (
												<Button
													variant="outline"
													size="sm"
													onClick={onRetry}
												>
													<RotateCw />
													Try again
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							) : rows.length === 0 ? (
								<TableRow className="hover:bg-transparent">
									<TableCell colSpan={colSpan} className="h-48">
										{/* No rows: when searching or filtering, say so and offer to clear them. */}
										<div className="flex flex-col items-center justify-center gap-2 text-center">
											<span className="flex size-10 items-center justify-center rounded-full bg-info">
												{filtered ? (
													<SearchX
														aria-hidden
														className="size-5 text-primary"
													/>
												) : (
													<FileX
														aria-hidden
														className="size-5 text-primary"
													/>
												)}
											</span>
											<p className="text-sm font-semibold">
												{params.search
													? `No results for “${params.search}”`
													: filtered
														? `No ${itemLabel} match the filters`
														: `No ${itemLabel} yet`}
											</p>
											{filtered && (
												<>
													<p className="text-[13px] text-muted-foreground">
														{activeFilters.length > 0
															? `${activeFilters.length === 1 ? 'One filter is' : `${activeFilters.length} filters are`} active. Clear them to see every ${itemLabel.replace(/s$/, '')}.`
															: 'Try different words.'}
													</p>
													<div className="flex gap-2">
														{params.search && (
															<Button
																variant="outline"
																size="sm"
																onClick={() => setSearch('')}
															>
																Clear search
															</Button>
														)}
														{activeFilters.length > 0 && (
															<Button
																variant="outline"
																size="sm"
																onClick={clearFilters}
															>
																Clear filters
															</Button>
														)}
													</div>
												</>
											)}
										</div>
									</TableCell>
								</TableRow>
							) : (
								rows.map(row => (
									<TableRow
										key={getRowId(row)}
										onClick={onRowClick ? () => onRowClick(row) : undefined}
										onKeyDown={
											onRowClick
												? e => {
														if (e.target !== e.currentTarget) return;
														if (e.key === 'Enter' || e.key === ' ') {
															e.preventDefault();
															onRowClick(row);
														}
													}
												: undefined
										}
										tabIndex={onRowClick ? 0 : undefined}
										aria-label={rowLabel?.(row)}
										className={cn(
											onRowClick &&
												'cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none'
										)}
									>
										{columns.map(column => (
											<TableCell
												key={column.id}
												className={cn(
													column.align === 'right' &&
														'text-right tabular-nums',
													column.className
												)}
											>
												{column.render(row)}
											</TableCell>
										))}
										{rowActions && (
											<TableCell
												className="w-12 text-right"
												onClick={e => e.stopPropagation()}
											>
												{rowActions(row)}
											</TableCell>
										)}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
						<p className="text-xs text-muted-foreground">
							Showing {from}–{to} of {numberFormat.format(total)} {itemLabel}
						</p>
						<div className="flex flex-wrap items-center gap-4">
							<label className="flex items-center gap-2 text-xs text-muted-foreground">
								Rows per page
								<Select
									value={String(pageSize)}
									onValueChange={v =>
										setParams({
											page_size: Number(v),
											page: 1
										} as Partial<TParams>)
									}
								>
									<SelectTrigger size="sm" className="h-8 w-[72px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PAGE_SIZES.map(size => (
											<SelectItem key={size} value={String(size)}>
												{size}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</label>
							<Pager
								page={page}
								pages={pages}
								onPage={p => setParams({ page: p } as Partial<TParams>)}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/*
 * ============================================================================
 * Column visibility
 * ============================================================================
 */

const STORAGE_PREFIX = appConfig.storageKeys.tableColumns;

/** Hidden columns, remembered per browser. Without `key` nothing is hidden. */
function useColumnVisibility<T>(key: string | undefined, columns: Column<T>[]) {
	const [hidden, setHiddenState] = useState<Set<string>>(() => {
		if (!key) return new Set();
		try {
			const stored = localStorage.getItem(STORAGE_PREFIX + key);
			if (stored) return new Set(JSON.parse(stored) as string[]);
		} catch {
			/* Storage unavailable: use the defaults. */
		}
		return new Set(columns.filter(c => c.defaultHidden).map(c => c.id));
	});

	const setHidden = (next: Set<string>) => {
		setHiddenState(next);
		if (!key) return;
		try {
			localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify([...next]));
		} catch {
			/* Not persisted: the choice lasts as long as the tab. */
		}
	};

	return [key ? hidden : new Set<string>(), setHidden] as const;
}

function ColumnsMenu<T>({
	columns,
	hidden,
	onChange
}: {
	columns: Column<T>[];
	hidden: Set<string>;
	onChange: (hidden: Set<string>) => void;
}) {
	const toggle = (id: string, visible: boolean) => {
		const next = new Set(hidden);
		if (visible) next.delete(id);
		else next.add(id);
		onChange(next);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="h-10 bg-card px-4">
					<Columns3 />
					Columns
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Visible columns
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{columns.map(column => (
					<DropdownMenuCheckboxItem
						key={column.id}
						checked={!hidden.has(column.id)}
						disabled={column.hideable === false}
						onCheckedChange={checked => toggle(column.id, checked === true)}
						// Keep the menu open to toggle several columns.
						onSelect={e => e.preventDefault()}
					>
						{column.label}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SortButton<T>({
	column,
	order,
	onClick
}: {
	column: Column<T>;
	order: unknown;
	onClick: () => void;
}) {
	const direction =
		order === column.sortKey ? 'asc' : order === `-${column.sortKey}` ? 'desc' : null;
	const Icon =
		direction === 'asc' ? ChevronUp : direction === 'desc' ? ChevronDown : ChevronsUpDown;
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
				direction && 'text-primary'
			)}
		>
			{column.label}
			<Icon aria-hidden className={cn('size-3.5', !direction && 'opacity-50')} />
		</button>
	);
}

function ariaSort(order: unknown, sortKey?: string) {
	if (!sortKey) return undefined;
	if (order === sortKey) return 'ascending';
	if (order === `-${sortKey}`) return 'descending';
	return 'none';
}

/** Page buttons: 1 … 4 5 6 … 52, always with the first and the last. */
function Pager({
	page,
	pages,
	onPage
}: {
	page: number;
	pages: number;
	onPage: (page: number) => void;
}) {
	const items = pageItems(page, pages);
	return (
		<nav aria-label="Pagination" className="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon-sm"
				disabled={page <= 1}
				onClick={() => onPage(page - 1)}
				aria-label="Previous page"
			>
				<ChevronLeft />
			</Button>
			{items.map((item, i) =>
				item === 'gap' ? (
					<span
						key={`gap-${i}`}
						aria-hidden
						className="w-8 text-center text-sm text-muted-foreground"
					>
						…
					</span>
				) : (
					<Button
						key={item}
						variant={item === page ? 'default' : 'outline'}
						size="icon-sm"
						onClick={() => onPage(item)}
						aria-label={`Page ${item}`}
						aria-current={item === page ? 'page' : undefined}
					>
						{item}
					</Button>
				)
			)}
			<Button
				variant="outline"
				size="icon-sm"
				disabled={page >= pages}
				onClick={() => onPage(page + 1)}
				aria-label="Next page"
			>
				<ChevronRight />
			</Button>
		</nav>
	);
}

function pageItems(page: number, pages: number): (number | 'gap')[] {
	if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
	const start = Math.max(2, Math.min(page - 1, pages - 4));
	const end = Math.min(pages - 1, Math.max(page + 1, 5));
	const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
	return [
		1,
		...(start > 2 ? ['gap' as const] : []),
		...middle,
		...(end < pages - 1 ? ['gap' as const] : []),
		pages
	];
}
