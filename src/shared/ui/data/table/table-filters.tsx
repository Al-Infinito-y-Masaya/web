import type { UseQueryResult } from '@tanstack/react-query';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

import type { PaginatedParams } from '@/shared/models/paginated-params/paginated-params';
import { Button } from '@/shared/ui/primitives/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/ui/primitives/select';
import { cn } from '@/shared/utils';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

/** Value a filter writes into the params (booleans stay booleans). */
export type FilterValue = string | boolean;

export type FilterOption = { label: string; value: FilterValue };

/** Keys of `TParams` a filter may write (everything but paging/order/search). */
export type FilterParam<TParams> = Exclude<Extract<keyof TParams, string>, keyof PaginatedParams>;

type BaseFilter<TParams> = {
	/** Key of `TParams` the chosen value is written to. */
	param: FilterParam<TParams>;
	/** Shown as "Label: Value". */
	label: string;
	/** Hidden behind "More filters" (shown when in use or requested). */
	advanced?: boolean;
};

/** Fixed options (enums, yes/no). */
export type StaticFilter<TParams> = BaseFilter<TParams> & {
	type: 'static';
	options: FilterOption[];
};

/** Options loaded from another service (e.g. categories). */
export type QueryFilter<TParams> = BaseFilter<TParams> & {
	type: 'query';
	/** Hook returning the options. Built by `createFilters().query`. */
	useOptions: () => { options: FilterOption[]; isLoading: boolean };
};

export type TableFilter<TParams> = StaticFilter<TParams> | QueryFilter<TParams>;

/** Minimal service a `query` filter needs: any `makeCrudService` result fits. */
type OptionsSource<TItem> = {
	hooks: { useListAll: (query: Record<string, never>) => UseQueryResult<TItem[], unknown> };
};

/*
 * ============================================================================
 * Factory
 * ============================================================================
 */

/**
 * Filter builder bound to `TParams`, so `param` autocompletes and is checked
 * against the resource's list params.
 *
 * ```ts
 * const f = createFilters<ItemListParams>();
 * const filters = f.define([
 *   f.enum({ param: 'status', label: 'Status', labels: itemStatusLabels }),
 *   f.query({ param: 'category', label: 'Category', source: categoryService,
 *             mapper: c => ({ label: c.name, value: c.id }) }),
 * ]);
 * ```
 */
export function createFilters<TParams>() {
	return {
		/** Hand-written options. */
		static: (filter: Omit<StaticFilter<TParams>, 'type'>): StaticFilter<TParams> => ({
			type: 'static',
			...filter
		}),

		/** Yes / No over a boolean param. */
		boolean: ({
			yes = 'Yes',
			no = 'No',
			...filter
		}: BaseFilter<TParams> & { yes?: string; no?: string }): StaticFilter<TParams> => ({
			type: 'static',
			...filter,
			options: [
				{ label: yes, value: true },
				{ label: no, value: false }
			]
		}),

		/** An enum with its labels: `labels` must cover every value. */
		enum: <E extends string>({
			labels,
			...filter
		}: BaseFilter<TParams> & { labels: Record<E, string> }): StaticFilter<TParams> => ({
			type: 'static',
			...filter,
			options: Object.entries<string>(labels).map(([value, label]) => ({ label, value }))
		}),

		/** Options from another service's `listAll`. */
		query: <TItem,>({
			source,
			mapper,
			...filter
		}: BaseFilter<TParams> & {
			source: OptionsSource<TItem>;
			mapper: (item: TItem) => FilterOption;
		}): QueryFilter<TParams> => ({
			type: 'query',
			...filter,
			useOptions: () => {
				const { data, isLoading } = source.hooks.useListAll({});
				return { options: (data ?? []).map(mapper), isLoading };
			}
		}),

		define: (filters: TableFilter<TParams>[]) => filters
	};
}

/*
 * ============================================================================
 * Render
 * ============================================================================
 */

// Radix Select does not accept "" as a value: sentinel for "All".
const ALL = '__all__';

type TableFiltersProps<TParams> = {
	filters: TableFilter<TParams>[];
	params: TParams;
	onParamsChange: (params: TParams) => void;
};

export function TableFilters<TParams>({
	filters,
	params,
	onParamsChange
}: TableFiltersProps<TParams>) {
	const [showAdvanced, setShowAdvanced] = useState(false);
	if (filters.length === 0) return null;

	const valueOf = (filter: TableFilter<TParams>) =>
		params[filter.param] as FilterValue | null | undefined;
	const hasActive = filters.some(f => valueOf(f) != null);

	const advanced = filters.filter(f => f.advanced);
	const activeAdvanced = advanced.filter(f => valueOf(f) != null).length;
	// An advanced filter in use (e.g. from the URL) is always shown.
	const visible = filters.filter(f => !f.advanced || showAdvanced || valueOf(f) != null);

	const apply = (patch: Partial<Record<FilterParam<TParams>, FilterValue | null>>) =>
		onParamsChange({ ...params, ...patch, page: 1 });

	return (
		<>
			{visible.map(filter => (
				<FilterSelect
					key={filter.param}
					filter={filter}
					value={valueOf(filter)}
					onChange={value =>
						apply({ [filter.param]: value } as Partial<
							Record<FilterParam<TParams>, FilterValue | null>
						>)
					}
				/>
			))}
			{advanced.length > activeAdvanced && (
				<Button
					variant="ghost"
					className="h-10 px-3 text-primary hover:text-primary"
					aria-expanded={showAdvanced}
					onClick={() => setShowAdvanced(v => !v)}
				>
					<Filter />
					{showAdvanced ? 'Fewer filters' : 'More filters'}
				</Button>
			)}
			{hasActive && (
				<Button
					variant="ghost"
					size="sm"
					className="text-muted-foreground"
					onClick={() =>
						apply(
							Object.fromEntries(filters.map(f => [f.param, null])) as Partial<
								Record<FilterParam<TParams>, null>
							>
						)
					}
				>
					<X />
					Clear filters
				</Button>
			)}
		</>
	);
}

function FilterSelect<TParams>({
	filter,
	value,
	onChange
}: {
	filter: TableFilter<TParams>;
	value: FilterValue | null | undefined;
	onChange: (value: FilterValue | null) => void;
}) {
	const { options, isLoading } =
		filter.type === 'query'
			? filter.useOptions()
			: { options: filter.options, isLoading: false };
	const selected = value == null ? undefined : options.find(o => o.value === value);
	const active = value != null;

	return (
		<Select
			value={value == null ? ALL : String(value)}
			onValueChange={key =>
				onChange(
					key === ALL ? null : (options.find(o => String(o.value) === key)?.value ?? null)
				)
			}
			disabled={isLoading}
		>
			<SelectTrigger
				className={cn('h-10 min-w-40 bg-card', active && 'border-primary/50')}
				aria-label={filter.label}
			>
				<span className="truncate">
					<span className="text-muted-foreground">{filter.label}: </span>
					{/* While `query` options load there is no label: show the raw value. */}
					{selected?.label ?? (active ? String(value) : 'All')}
				</span>
				{/* SelectValue stays hidden: the visible text is the one above. */}
				<span className="sr-only">
					<SelectValue />
				</span>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL}>All</SelectItem>
				{options.map(option => (
					<SelectItem key={String(option.value)} value={String(option.value)}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
