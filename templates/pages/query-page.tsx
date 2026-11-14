import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { client } from '@/shared/client';
import { unwrapOrThrow } from '@/shared/models/result/result';
import { PageSkeleton } from '@/shared/ui/feedback/page-skeleton';
import { PageHeader } from '@/shared/ui/layout/page-header';
import { SectionCard } from '@/shared/ui/layout/section-card';

/**
 * DATA PAGE TEMPLATE (single request, no CRUD service)
 * 1. Describe the request once with `queryOptions`.
 * 2. The loader fills the cache before render.
 * 3. The component reads it with `useSuspenseQuery` (data is never undefined).
 */
const healthQuery = queryOptions({
	queryKey: ['health'],
	queryFn: () => unwrapOrThrow(client.GET('/health').map(({ data }) => data))
});

export const Route = createFileRoute('/_app/query-page')({
	loader: ({ context }) => context.queryClient.ensureQueryData(healthQuery),
	pendingComponent: () => <PageSkeleton stats={0} rows={2} />,
	component: QueryPage
});

function QueryPage() {
	const { data } = useSuspenseQuery(healthQuery);
	return (
		<>
			<PageHeader title="API status" />
			<SectionCard title="Health">
				<pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>
			</SectionCard>
		</>
	);
}
