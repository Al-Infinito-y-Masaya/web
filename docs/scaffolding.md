# Scaffolding

## `pnpm new:feature`

Generates a CRUD feature (types, API adapter, service, schema, fields, form sheet, table view) and its list + detail pages from `templates/`:

```bash
pnpm new:feature products                  # Product, /products
pnpm new:feature people --entity Person    # irregular plural
pnpm new:feature products --no-routes      # feature folder only
pnpm new:feature products --force          # overwrite
```

Output:

```
src/features/products/{types,api,service,schemas}.ts
src/features/products/{fields,form-sheet,table-view}.tsx
src/app/routes/_app/products/{index,$id}.tsx
```

Then:

1. Make sure `openapi/schema.json` has `/products`, `/products/{id}` and a `Product` schema (with at least `id` and `name`), and run `pnpm generate:api`. The generated code uses the typed client, so the compiler tells you if the API differs.
2. Edit `schemas.ts`, `fields.tsx` and `table-view.tsx` for your real fields.
3. Add the page to `src/app/navigation.ts`.

## Templates

`templates/` is excluded from type-checking, linting and formatting; placeholders are replaced by the script:

| Placeholder  | Example (`products`) |
| ------------ | -------------------- |
| `__Entity__` | `Product`            |
| `__entity__` | `product`            |
| `__route__`  | `products`           |
| `__label__`  | `product`            |
| `__labels__` | `products`           |
| `__Title__`  | `Products`           |

Change the templates to change what every future feature looks like. `templates/pages/` holds standalone page templates to copy by hand (see [Routing](routing.md#page-templates)).
