# Frontend Factory

A production-ready React starter. Clone it, point it at your API, and start building pages instead of wiring tools together.

| Concern      | Choice                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Build / dev  | [Vite](https://vite.dev) + TypeScript (strict)                                                                   |
| UI           | React 19, [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) on Radix, lucide icons  |
| Routing      | [TanStack Router](https://tanstack.com/router) — file-based, type-safe links, params and search params           |
| Server state | [TanStack Query](https://tanstack.com/query) + a CRUD service factory                                            |
| API client   | [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) with types generated from your OpenAPI schema             |
| Errors       | Typed `AppError` union + [neverthrow](https://github.com/supermacro/neverthrow) `Result`s                        |
| Forms        | [React Hook Form](https://react-hook-form.com) + [Zod 4](https://zod.dev), server errors mapped onto fields      |
| Quality      | ESLint (flat config), Prettier (import + Tailwind class sorting), [Vitest](https://vitest.dev) + Testing Library |
| Extras       | Light/dark/system theme, devtools in dev, `just` task runner, feature scaffolding script                         |

## Quick start

```bash
pnpm install           # also generates API types from openapi/schema.json
cp .env.example .env   # set VITE_API_URL to your backend
pnpm dev               # http://localhost:3000
```

Requires Node 22+ and pnpm 11. The example pages talk to a real backend (no mocks): without one running you will see the login page and a connection error when signing in, which is expected.

## Scripts

| Command                        | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `pnpm dev`                     | Dev server with HMR (regenerates API types first)          |
| `pnpm build` / `pnpm preview`  | Type-check + production build into `dist/` / serve it      |
| `pnpm typecheck`               | `tsc --noEmit`                                             |
| `pnpm lint` / `pnpm lint:fix`  | ESLint                                                     |
| `pnpm format` / `format:check` | Prettier                                                   |
| `pnpm test` / `test:watch`     | Vitest (jsdom)                                             |
| `pnpm check`                   | Everything CI should run                                   |
| `pnpm generate:api`            | `openapi/schema.json` → `src/shared/client/api-types.d.ts` |
| `pnpm new:feature <name>`      | Scaffold a CRUD feature with list + detail pages           |

Every script has a [`just`](https://just.systems) equivalent (`just --list`), plus `just api` to download your backend's schema and regenerate types.

## Project layout

```
openapi/schema.json        API contract (replace with your backend's)
templates/                 Copy-paste page templates + scaffolding sources
scripts/new-feature.mjs    Feature generator
src/
  app/
    main.tsx               Entry: QueryClient + Router
    globals.css            Tailwind + design tokens (light/dark)
    navigation.ts          Sidebar entries
    components/            App-level components (brand, user menu, devtools)
    routes/                File-based routes (one file = one page)
  config/                  env, app constants, query client, zod setup
  features/<name>/         Domain code: types, api, service, schemas, components
  shared/
    client/                Typed API client + middleware
    data/                  CRUD service factory
    models/                AppError, Result helpers, pagination types
    hooks/  utils/         Generic hooks and helpers
    ui/                    primitives (shadcn), form, data (tables), feedback, layout, theme
  test/                    Vitest setup + render helpers
```

## Documentation

1. [Getting started](docs/getting-started.md) — setup, env vars, connecting your API
2. [Architecture](docs/architecture.md) — layers, folder rules, data flow
3. [Routing & pages](docs/routing.md) — adding pages, layouts, guards, search params, page templates
4. [Data fetching](docs/data-fetching.md) — API client, CRUD services, queries and mutations
5. [Forms](docs/forms.md) — `useZodForm`, fields, server errors, unsaved changes
6. [Tables](docs/tables.md) — `TableView`, filters, URL-synced params
7. [Error handling](docs/error-handling.md) — `AppError`, `Result`, where errors surface
8. [Authentication](docs/authentication.md) — session flow, guards, CSRF/JWT/bearer variants
9. [Styling & UI](docs/styling.md) — tokens, theming, adding shadcn components
10. [Testing](docs/testing.md) — Vitest, Testing Library, what to test
11. [Scaffolding](docs/scaffolding.md) — `pnpm new:feature` and templates

## Make it yours

- [ ] Rename in `package.json`, `index.html` (`<title>`) and `src/config/app.ts`
- [ ] Replace `public/favicon.svg`
- [ ] Replace `openapi/schema.json` with your API (`just api`) and adapt `src/features/auth/api.ts`
- [ ] Adjust colors in `src/app/globals.css`
- [ ] Delete `src/features/items` and `src/app/routes/_app/items` once you have your own features
