# Getting started

## Requirements

- Node.js 22+
- pnpm 11 (`corepack enable` picks the version from `package.json`)
- Optional: [`just`](https://just.systems) for the task shortcuts

## Install and run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`pnpm install` runs `pnpm generate:api` (postinstall), which turns `openapi/schema.json` into `src/shared/client/api-types.d.ts`. That file and `src/app/routeTree.gen.ts` are **generated and git-ignored**: they are recreated on `dev`, `build`, `typecheck` and `test`.

## Environment variables

All variables live in `.env` (see `.env.example`). Only `VITE_*` variables reach the browser, and every one of them must be:

1. declared in `src/vite-env.d.ts` (types), and
2. parsed in `src/config/env.ts` (validation and defaults).

Code reads `env.apiUrl`, never `import.meta.env` directly. A missing or invalid variable fails at startup with a readable message.

| Variable        | Default                 | Purpose                                     |
| --------------- | ----------------------- | ------------------------------------------- |
| `VITE_API_URL`  | `http://localhost:8000` | Backend base URL                            |
| `VITE_DEBUG`    | `false`                 | Log every API request/response              |
| `PORT`          | `3000`                  | Dev server port (not exposed to the client) |
| `DEV_API_PROXY` | —                       | Proxy `/api/*` to this origin in dev        |
| `OPENAPI_URL`   | —                       | Used by `just api` to download the schema   |

### Avoiding CORS in development

Set `VITE_API_URL=/api` and `DEV_API_PROXY=http://localhost:8000`. Vite then forwards `/api/items` to `http://localhost:8000/items`, so the browser sees a same-origin request.

## Connecting your backend

1. Get your API's OpenAPI document into `openapi/schema.json`:
    - `OPENAPI_URL=https://api.example.com/openapi.json just api`, or
    - copy the file by hand and run `pnpm generate:api`.
2. Run `pnpm typecheck`. Every call that no longer matches the API is now a compile error. Fix or delete them (the `items` example will break if your API has no `/items`).
3. Adapt `src/features/auth/api.ts` to your login/logout/current-user endpoints.
4. If your error bodies are not `{ detail, code?, field_errors? }`, adapt `fromResponse` in `src/shared/models/app-error/app-error.ts`.
5. If your list endpoints do not return `{ results, elements, current, pages, next, previous }`, convert the response in each feature's `api.ts` (see [Data fetching](data-fetching.md#different-pagination-shapes)).

## Editor setup

Open the repo in VS Code and install the recommended extensions (`.vscode/extensions.json`): ESLint, Prettier, Tailwind CSS IntelliSense, Vitest. Format-on-save and ESLint fixes are preconfigured.
