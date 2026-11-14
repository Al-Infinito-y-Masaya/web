import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

/** A QueryClient for tests: no retries, no cache sharing between tests. */
export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } }
	});
}

/**
 * `render` with the app's providers plus a ready `userEvent` instance.
 *
 * ```ts
 * const { user } = renderWithProviders(<MyForm />);
 * await user.type(screen.getByLabelText('Name'), 'Ada');
 * ```
 */
export function renderWithProviders(
	ui: ReactElement,
	{
		queryClient = createTestQueryClient(),
		...options
	}: RenderOptions & { queryClient?: QueryClient } = {}
) {
	const Wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return {
		user: userEvent.setup(),
		queryClient,
		...render(ui, { wrapper: Wrapper, ...options })
	};
}
