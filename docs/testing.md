# Testing

[Vitest](https://vitest.dev) with jsdom and [Testing Library](https://testing-library.com). Config lives in the `test` block of `vite.config.ts`.

```bash
pnpm test            # run once
pnpm test:watch      # watch mode
pnpm test:coverage   # v8 coverage report in ./coverage
```

Tests sit next to the code: `text-field.tsx` → `text-field.test.tsx`.

## Setup

`src/test/setup.ts` runs before every file: jest-dom matchers (`toBeInTheDocument`, `toBeDisabled`…), the global Zod config, and DOM cleanup after each test.

`src/test/render.tsx` provides `renderWithProviders`, which wraps the UI in a fresh `QueryClient` (no retries) and returns a `userEvent` instance:

```tsx
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/render';

test('submits the form', async () => {
	const { user } = renderWithProviders(<MyForm />);
	await user.type(screen.getByLabelText('Name'), 'Widget');
	await user.click(screen.getByRole('button', { name: 'Save' }));
	expect(await screen.findByText('Saved')).toBeInTheDocument();
});
```

## What to test

| Layer                 | How                                                                          | Examples in the repo                  |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| Pure logic / models   | Plain unit tests                                                             | `app-error.test.ts`, `result.test.ts` |
| API client/middleware | Fake `Request`/`Response`, `vi.fn()` for fetch                               | `shared/client/**/*.test.ts`          |
| Components            | Render, interact like a user, assert on roles/labels/text                    | `shared/ui/form/*.test.tsx`           |
| Features              | Stub the adapter (`itemsApi`) with `vi.spyOn` returning `okAsync`/`errAsync` | —                                     |

Query by role and label (`getByRole('button', { name: 'Save' })`, `getByLabelText('Email')`) rather than test ids or classes: it tests accessibility for free.

### Mocking a feature's API

```ts
import { okAsync } from 'neverthrow';

import { itemsApi } from '@/features/items/api';

vi.spyOn(itemsApi, 'list').mockReturnValue(
	okAsync({ results: [item], elements: 1, current: 1, pages: 1, next: false, previous: false })
);
```
