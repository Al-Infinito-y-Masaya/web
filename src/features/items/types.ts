import type { RequestBody, Schema } from '@/shared/client/api-helpers';
import type { PaginatedParams } from '@/shared/models/paginated-params/paginated-params';

/*
 * Types come straight from the OpenAPI schema, so the frontend breaks at
 * compile time when the backend contract changes.
 */

export type Item = Schema<'Item'>;
export type ItemStatus = Schema<'ItemStatus'>;
export type ItemOrder = Schema<'ItemOrder'>;
export type ItemCreate = RequestBody<'/items', 'post'>;
export type ItemUpdate = RequestBody<'/items/{id}', 'patch'>;

/** List params: paging/search/order plus this resource's filters. */
export type ItemListParams = PaginatedParams<ItemOrder> & {
	status?: ItemStatus | null;
};
