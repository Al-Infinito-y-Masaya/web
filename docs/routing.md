# Routing & pages

Routing is file-based ([TanStack Router](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)). Every file in `src/app/routes` is a route; the plugin regenerates `routeTree.gen.ts` when you save.

## Current route map

| File                     | URL              | Notes                                    |
| ------------------------ | ---------------- | ---------------------------------------- |
| `__root.tsx`             | —                | Providers, 404 and error boundaries      |
| `index.tsx`              | `/`              | Redirects to `/dashboard`                |
| `_auth/route.tsx`        | —                | Public layout; redirects signed-in users |
| `_auth/login.tsx`        | `/login`         | `?redirect=` search param                |
| `_app/route.tsx`         | —                | Auth guard + app shell (sidebar, topbar) |
| `_app/dashboard.tsx`     | `/dashboard`     | Stat cards + recent list                 |
| `_app/items/index.tsx`   | `/items`         | **List page template**                   |
| `_app/items/new.tsx`     | `/items/new`     | **Form page template**                   |
| `_app/items/$itemId.tsx` | `/items/:itemId` | **Detail page template**                 |
| `_app/settings.tsx`      | `/settings`      | **Tabbed page template**                 |

Naming conventions:

- `_name/` — **pathless layout**: wraps children without adding a URL segment.
- `$param` — dynamic segment, read with `Route.useParams()`.
- `route.tsx` — the layout of its folder; `index.tsx` — the folder's own page.
- `-components/` (dash prefix) — ignored by the router; use it for route-local files.

## Adding a page

1. Create `src/app/routes/_app/reports.tsx` (inside `_app` = requires sign-in).
2. Start from `templates/pages/blank-page.tsx` (or `query-page.tsx` for a page backed by one request).
3. Fix the path in `createFileRoute('/_app/reports')` — the editor autocompletes it once the dev server has run.
4. Add it to the sidebar in `src/app/navigation.ts`.

## Page templates

| Template                                | Use it for                                  |
| --------------------------------------- | ------------------------------------------- |
| `templates/pages/blank-page.tsx`        | Static or custom pages                      |
| `templates/pages/query-page.tsx`        | One request, loader + `useSuspenseQuery`    |
| `src/app/routes/_app/items/index.tsx`   | Paginated, searchable, filterable list      |
| `src/app/routes/_app/items/$itemId.tsx` | Record page, 404 handling, edit/delete      |
| `src/app/routes/_app/items/new.tsx`     | Full-page form with unsaved-changes guard   |
| `src/app/routes/_app/settings.tsx`      | Tabs stored in the URL                      |
| `templates/routes/*`                    | List/detail pair used by `pnpm new:feature` |

## Loading data

Prefer loaders + the query cache:

```tsx
export const Route = createFileRoute('/_app/items/$itemId')({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(itemService.options.detail(params.itemId)),
	component: ItemPage
});

function ItemPage() {
	const { itemId } = Route.useParams();
	const { data } = useSuspenseQuery(itemService.options.detail(itemId)); // never undefined
}
```

`defaultPreload: 'intent'` (in `main.tsx`) runs the loader when the user hovers a link, so most navigations feel instant.

## Search params

Validate them with Zod so they are typed and safe:

```tsx
export const Route = createFileRoute('/_app/settings')({
	validateSearch: z.object({
		tab: z.enum(['profile', 'appearance']).default('profile').catch('profile')
	})
});
const { tab } = Route.useSearch();
navigate({ search: { tab: 'appearance' } });
```

Use `.default()` so links without the param stay valid, and `.catch()` so a bad value in the URL falls back instead of erroring.

## Guards and redirects

`beforeLoad` runs before any child loader. `_app/route.tsx` uses it as the auth guard:

```tsx
beforeLoad: async ({ context, location }) => {
	const user = await context.queryClient.ensureQueryData(sessionQuery);
	if (!user) throw redirect({ to: '/login', search: { redirect: location.href } });
	return { user }; // available as `context.user` in children
};
```

Add role checks the same way in a nested `route.tsx`.

## Errors and 404

- A loader that throws `notFound()` renders the root `notFoundComponent`.
- Any other thrown error renders the root `errorComponent` (`ErrorState` with a retry).
- Override either per route with `notFoundComponent` / `errorComponent` / `pendingComponent`.
