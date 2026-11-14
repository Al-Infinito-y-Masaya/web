import { createFileRoute } from '@tanstack/react-router';

import { PageHeader } from '@/shared/ui/layout/page-header';
import { SectionCard } from '@/shared/ui/layout/section-card';

/**
 * BLANK PAGE TEMPLATE
 * Copy to src/app/routes/_app/<path>.tsx (inside the authenticated layout) or
 * src/app/routes/<path>.tsx (public), then fix the path in createFileRoute.
 * The dev server regenerates the route tree on save.
 */
export const Route = createFileRoute('/_app/blank-page')({
	component: BlankPage
});

function BlankPage() {
	return (
		<>
			<PageHeader title="Page title" description="One sentence about this page." />
			<SectionCard title="Section">
				<p className="text-sm text-muted-foreground">Content goes here.</p>
			</SectionCard>
		</>
	);
}
