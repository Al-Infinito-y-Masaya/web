import { errAsync, okAsync } from 'neverthrow';

import { client } from '@/shared/client';
import type { CrudAdapter } from '@/shared/data/crud-service/crud-service';
import { fetchAllPages } from '@/shared/data/fetch-all-pages';
import { AppErrors } from '@/shared/models/app-error/app-error';

import type {
	__Entity__,
	__Entity__Create,
	__Entity__ListParams,
	__Entity__Update
} from './types';

const required = <T>({ data }: { data?: T }) => (data ? okAsync(data) : errAsync(AppErrors.empty()));

const toQuery = (params: Partial<__Entity__ListParams>) =>
	Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));

/** HTTP adapter for /__route__, checked against openapi/schema.json. */
export const __entity__Api: CrudAdapter<
	__Entity__,
	__Entity__ListParams,
	__Entity__Create,
	__Entity__Update
> = {
	list: params => client.GET('/__route__', { params: { query: toQuery(params) } }).andThen(required),

	listAll: params =>
		fetchAllPages((page, page_size) =>
			client
				.GET('/__route__', { params: { query: toQuery({ ...params, page, page_size }) } })
				.andThen(required)
		),

	detail: id => client.GET('/__route__/{id}', { params: { path: { id } } }).andThen(required),

	create: body => client.POST('/__route__', { body }).andThen(required),

	update: (id, body) =>
		client.PATCH('/__route__/{id}', { params: { path: { id } }, body }).andThen(required),

	remove: id => client.DELETE('/__route__/{id}', { params: { path: { id } } }).map(() => undefined)
};
