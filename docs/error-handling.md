# Error handling

## `AppError`

Every failure in the app is an `AppError` (`src/shared/models/app-error/app-error.ts`), a union discriminated by `kind`:

| kind           | When                                 | Extra fields            |
| -------------- | ------------------------------------ | ----------------------- |
| `network`      | fetch failed, offline, CORS, timeout |                         |
| `unauthorized` | 401                                  | `code`                  |
| `forbidden`    | 403                                  | `code`                  |
| `notFound`     | 404                                  | `resource`              |
| `validation`   | 400/422 with `field_errors`          | `fieldErrors`, `status` |
| `http`         | any other non-2xx                    | `status`, `code`        |
| `parse`        | body could not be read or validated  |                         |
| `empty`        | 2xx without the expected data        |                         |
| `custom`       | raised on purpose by app code        |                         |
| `unknown`      | anything else                        |                         |

Create them with the factories (`AppErrors.notFound()`), check them with `switch (error.kind)` and end exhaustive switches with `assertUnreachableAppError(error)`.

## Values vs. exceptions

- **Adapters and the API client** return `ResultAsync<T, AppError>` (neverthrow). Compose with `.map`, `.andThen`, `.orElse`, `.match` — no try/catch.
- **TanStack Query** needs thrown errors. `unwrapOrThrow(result)` throws an `AppException` (an `Error` with the typed `AppError` in `.error`).
- **Anything caught** can be normalized with `toAppError(e)`.

```ts
const { error } = itemService.hooks.useDetail(id);
if (error?.error.kind === 'notFound') …
```

## Where errors surface

| Situation                  | UI                                                             |
| -------------------------- | -------------------------------------------------------------- |
| Loader throws `notFound()` | Root "Page not found"                                          |
| Loader/render throws       | Root `errorComponent` → `ErrorState` with retry                |
| Query error in a component | `ErrorState` / table error row with retry                      |
| Form submit fails          | Field messages + `<FormErrorAlert>` (via `useZodForm`)         |
| Mutation outside a form    | `<Alert tone="error" title={describeError(mutation.error)} />` |
| Any 401                    | Session cleared, redirect to `/login?redirect=…`               |

User-facing copy lives in `describe-error.ts` (`describeAppError`, `describeError`): edit it once to change messages everywhere.

## Adapting to your backend

`fromResponse` expects `{ detail?, message?, code?, field_errors? }`. If your API uses e.g. RFC 7807 (`title`, `errors`), change that function only; nothing else depends on the wire format.
