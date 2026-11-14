import { errAsync, okAsync } from 'neverthrow';

import { client } from '@/shared/client';
import type { CrudAdapter } from '@/shared/data/crud-service/crud-service';
import { fetchAllPages } from '@/shared/data/fetch-all-pages';
import { AppErrors } from '@/shared/models/app-error/app-error';

import type { Item, ItemCreate, ItemListParams, ItemUpdate } from './types';

/** `data` is optional in openapi-fetch's types; a 2xx without a body is an error here. */
const required = <T>({ data }: { data?: T }) =>
	data ? okAsync(data) : errAsync(AppErrors.empty());

/** Drops `null`s: the query-string serializer would send them as "null". */
const toQuery = (params: Partial<ItemListParams>) =>
	Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)) as {
		[K in keyof ItemListParams]?: NonNullable<ItemListParams[K]>;
	};

/**
 * HTTP adapter for /items, written against the typed client: every path,
 * param and body is checked against `openapi/schema.json`.
 */
export const itemsApi: CrudAdapter<Item, ItemListParams, ItemCreate, ItemUpdate> = {
	list: params => client.GET('/items', { params: { query: toQuery(params) } }).andThen(required),

	listAll: params =>
		fetchAllPages((page, page_size) =>
			client
				.GET('/items', { params: { query: toQuery({ ...params, page, page_size }) } })
				.andThen(required)
		),

	detail: id => client.GET('/items/{id}', { params: { path: { id } } }).andThen(required),

	create: body => client.POST('/items', { body }).andThen(required),

	update: (id, body) =>
		client.PATCH('/items/{id}', { params: { path: { id } }, body }).andThen(required),

	remove: id => client.DELETE('/items/{id}', { params: { path: { id } } }).map(() => undefined)
};
