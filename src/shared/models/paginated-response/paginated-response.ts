/**
 * Envelope every paginated endpoint returns. If your backend uses another
 * shape (`{ items, total }`, cursor-based…), convert it in the resource's
 * live adapter so the UI keeps working unchanged.
 */
export interface PaginatedResponse<T> {
	/** Whether there is a next page. */
	next: boolean;
	/** Whether there is a previous page. */
	previous: boolean;
	/** Total number of elements across all pages. */
	elements: number;
	/** Current page (1-based). */
	current: number;
	/** Total number of pages. */
	pages: number;
	results: T[];
}
