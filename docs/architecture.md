# Architecture

## Layers

```
routes  ──►  features  ──►  shared
  │             │              │
  │ page wiring │ domain code  │ generic, domain-free building blocks
```

| Layer              | Contains                                                             | May import from                            |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| `src/app/routes`   | One file per page: loaders, search params, layout of the page        | features, shared, config                   |
| `src/features/<x>` | Types, API adapter, service, schemas, forms, tables for one domain   | shared, config, other features (sparingly) |
| `src/shared`       | API client, data helpers, UI kit, hooks, utils — **no domain words** | config                                     |
| `src/config`       | Env, constants, query client, zod setup                              | shared/models                              |

Rules of thumb:

- If it mentions a business concept ("item", "invoice"), it belongs in `features/`.
- If two features need the same component, move the generic part to `shared/`.
- Route files stay thin: they connect URL ↔ feature components. Logic goes in the feature.

## A feature folder

`src/features/items` is the reference implementation:

| File                     | Role                                                            |
| ------------------------ | --------------------------------------------------------------- |
| `types.ts`               | Types derived from the OpenAPI schema (`Schema<'Item'>`)        |
| `api.ts`                 | `CrudAdapter`: one function per endpoint, returns `ResultAsync` |
| `service.ts`             | `makeCrudService(...)`: query keys, options, hooks              |
| `schemas.ts`             | Zod form schema + conversions between API and form shapes       |
| `labels.ts`              | Display text / tones for enums                                  |
| `item-fields.tsx`        | Form fields shared by the create page and edit sheet            |
| `item-form-sheet.tsx`    | Create/edit side panel                                          |
| `delete-item-dialog.tsx` | Confirmation dialog                                             |
| `table-view.tsx`         | Columns, filters, quick view for the list page                  |

## Data flow

```
component ─ hook ─► service (TanStack Query cache)
                       │ queryFn / mutationFn
                       ▼
                 adapter (features/x/api.ts)  ── ResultAsync<T, AppError>
                       │
                       ▼
                 APIClient (typed, middleware) ── fetch ── backend
```

- **Adapters** return `ResultAsync<T, AppError>`: errors are values, never thrown.
- **Services** convert to throwing (`unwrapOrThrow`) at the TanStack Query boundary, wrapping the error in `AppException`, so `query.error.error.kind` is typed.
- **Loaders** call `queryClient.ensureQueryData(service.options.detail(id))`, so data is cached before the page renders and shared with components.

## Generated files

| File                               | From                  | When                                        |
| ---------------------------------- | --------------------- | ------------------------------------------- |
| `src/app/routeTree.gen.ts`         | `src/app/routes/**`   | dev server / build (TanStack Router plugin) |
| `src/shared/client/api-types.d.ts` | `openapi/schema.json` | `pnpm generate:api` (runs automatically)    |

Never edit them; both are git-ignored.
