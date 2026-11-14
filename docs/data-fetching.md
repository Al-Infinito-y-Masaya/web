# Data fetching

## The typed API client

`src/shared/client/index.ts` exports `client`, an `openapi-fetch` client wrapped so every call returns a `ResultAsync<{ data, response }, AppError>`:

```ts
import { client } from '@/shared/client';

const result = await client.GET('/items/{id}', { params: { path: { id } } });
result.match(
	({ data }) => console.log(data.name), // typed from the schema
	error => console.error(error.kind) // typed AppError
);
```

Paths, params, bodies and responses are all checked against `openapi/schema.json`. Change the schema → run `pnpm generate:api` → the compiler shows every call to update.

Type helpers in `src/shared/client/api-helpers.ts`:

```ts
type Item = Schema<'Item'>; // components.schemas.Item
type ItemCreate = RequestBody<'/items', 'post'>; // JSON body of POST /items
type Page = ResponseBody<'/items', 'get'>; // 2xx JSON body
```

### Middleware

Registered in `src/shared/client/index.ts`:

| Middleware        | Does                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `errorMiddleware` | Non-2xx and network failures → `AppError` (always on)                |
| `logMiddleware`   | Console logging (when `VITE_DEBUG=true`)                             |
| `CSRFMiddleware`  | Adds a CSRF header (opt-in, see [Authentication](authentication.md)) |
| `JWTMiddleware`   | Refresh on 401 and replay (opt-in)                                   |

`appFetch` (`fetch.ts`) retries **network failures** 3 times with backoff and sends cookies (`credentials: 'include'`).

## CRUD services

Most REST resources need the same things: a paginated list, "all" for selects, detail, create, update, delete, with consistent cache keys and invalidation. `makeCrudService` builds that from an adapter:

```ts
// features/items/api.ts — one function per endpoint
export const itemsApi: CrudAdapter<Item, ItemListParams, ItemCreate, ItemUpdate> = {
	list: params => client.GET('/items', { params: { query: toQuery(params) } }).andThen(required),
	detail: id => client.GET('/items/{id}', { params: { path: { id } } }).andThen(required)
	// listAll, create, update, remove…
};

// features/items/service.ts
export const itemService = makeCrudService({ name: 'items', adapter: itemsApi });
```

What you get:

| API                                                 | Use                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `itemService.hooks.useList(params)`                 | Paginated list (keeps previous page while loading)                               |
| `itemService.hooks.useListAll(filters)`             | Every row, e.g. for a select                                                     |
| `itemService.hooks.useDetail(id)`                   | One record                                                                       |
| `itemService.hooks.useCreate/useUpdate/useRemove()` | Mutations that invalidate/update the cache                                       |
| `itemService.options.list/detail/…`                 | Same as plain options for loaders, `useSuspenseQuery`, `useQueries`, prefetching |
| `itemService.keys`                                  | `['items', 'list', params]`, `['items', 'detail', id]`… for manual invalidation  |
| `itemService.api`                                   | The raw adapter (no cache)                                                       |

Cache behaviour after mutations:

- **create** → invalidates every list
- **update** → writes the returned record into the detail cache, invalidates lists
- **remove** → removes the detail, invalidates lists

### Queries that are not CRUD

Use `queryOptions` directly; keep it next to the feature:

```ts
export const statsQuery = queryOptions({
	queryKey: ['items', 'stats'],
	queryFn: () => unwrapOrThrow(client.GET('/items/stats').map(({ data }) => data))
});
```

`unwrapOrThrow` is the bridge from `ResultAsync` (errors as values) to TanStack Query (errors thrown as `AppException`).

### Different pagination shapes

The UI expects `PaginatedResponse<T>` (`results`, `elements`, `current`, `pages`, `next`, `previous`). If your API returns something else, map it in the adapter:

```ts
list: params =>
	client
		.GET('/items', { params: { query } })
		.andThen(required)
		.map(({ items, total }) => ({
			results: items,
			elements: total,
			current: params.page ?? 1,
			pages: Math.ceil(total / (params.page_size ?? 10)),
			next: (params.page ?? 1) * (params.page_size ?? 10) < total,
			previous: (params.page ?? 1) > 1
		}));
```

## Query client defaults

`src/config/query-client.ts`:

- `staleTime: 30s`, no refetch on window focus
- No retries for `unauthorized`, `forbidden`, `notFound`, `validation`, `parse`; 2 retries otherwise
- Any 401 (outside the session check) dispatches `events.sessionExpired`, which sends the user to `/login`

The default error type is registered globally (`src/config/tanstack-query.d.ts`), so `query.error` is an `AppException` everywhere.
