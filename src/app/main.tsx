import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/config/zod';
import './globals.css';

import { createQueryClient } from '@/config/query-client';
import { Spinner } from '@/shared/ui/primitives/spinner';

import { routeTree } from './routeTree.gen';

const queryClient = createQueryClient();

const router = createRouter({
	routeTree,
	context: { queryClient },
	// Loaders read through the query cache, so the router never caches on its own.
	defaultPreload: 'intent',
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultPendingComponent: () => (
		<div className="flex justify-center py-20">
			<Spinner className="size-6 text-muted-foreground" />
		</div>
	)
});

// Register the router for type-safe links, params and search everywhere.
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>
);
