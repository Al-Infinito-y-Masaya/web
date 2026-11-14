import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { ItemFormSheet } from '@/features/items/item-form-sheet';
import { itemService } from '@/features/items/service';
import { itemTableView } from '@/features/items/table-view';
import { paramsFromSearch, QueryTable, searchFromParams } from '@/shared/ui/data/table/table-view';
import { PageHeader } from '@/shared/ui/layout/page-header';
import { Button } from '@/shared/ui/primitives/button';

/**
 * LIST PAGE TEMPLATE
 * Table params (page, search, order, filters) live in the URL, so every view
 * is shareable and survives reloads. `paramsFromSearch` drops anything the
 * view does not declare.
 */
export const Route = createFileRoute('/_app/items/')({
	validateSearch: (search): Record<string, unknown> => search,
	loaderDeps: ({ search }) => paramsFromSearch(itemTableView, search),
	// Prefetch so the table renders with data on first paint.
	loader: ({ context, deps }) =>
		context.queryClient.prefetchQuery(itemService.options.list(deps)),
	component: ItemsPage
});

function ItemsPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const params = paramsFromSearch(itemTableView, search);
	const [creating, setCreating] = useState(false);

	return (
		<>
			<PageHeader
				title={itemTableView.title}
				description={itemTableView.description}
				actions={
					<Button onClick={() => setCreating(true)}>
						<Plus /> New item
					</Button>
				}
			/>
			<QueryTable
				view={itemTableView}
				params={params}
				onParamsChange={next => navigate({ search: searchFromParams(next), replace: true })}
			/>
			<ItemFormSheet open={creating} onOpenChange={setCreating} />
		</>
	);
}
