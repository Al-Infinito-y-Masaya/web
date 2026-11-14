/**
 * Query params every paginated list endpoint accepts. Extend it with the
 * resource's filters: `type ItemListParams = PaginatedParams<ItemOrder> & { status?: ... }`.
 */
export type PaginatedParams<TOrder = unknown> = {
	/** 1-based page number. */
	page?: number;
	page_size?: number;
	/** A sort key, `-key` for descending. */
	order?: TOrder | null;
	/** Free-text search. */
	search?: string | null;
};

export type OmitPagingInformation<TList extends PaginatedParams> = Omit<
	TList,
	'page' | 'page_size'
>;
