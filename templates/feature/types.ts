import type { RequestBody, Schema } from '@/shared/client/api-helpers';
import type { PaginatedParams } from '@/shared/models/paginated-params/paginated-params';

// Types come from openapi/schema.json. Rename the schema names if your backend uses others.
export type __Entity__ = Schema<'__Entity__'>;
export type __Entity__Create = RequestBody<'/__route__', 'post'>;
export type __Entity__Update = RequestBody<'/__route__/{id}', 'patch'>;

/** List params: paging/search/order plus this resource's filters. */
export type __Entity__ListParams = PaginatedParams<string> & {
	// status?: __Entity__Status | null;
};
