import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { __Entity__FormSheet } from '@/features/__route__/form-sheet';
import { __entity__Service } from '@/features/__route__/service';
import { __entity__TableView } from '@/features/__route__/table-view';
import { paramsFromSearch, QueryTable, searchFromParams } from '@/shared/ui/data/table/table-view';
import { PageHeader } from '@/shared/ui/layout/page-header';
import { Button } from '@/shared/ui/primitives/button';

export const Route = createFileRoute('/_app/__route__/')({
	validateSearch: (search): Record<string, unknown> => search,
	loaderDeps: ({ search }) => paramsFromSearch(__entity__TableView, search),
	loader: ({ context, deps }) =>
		context.queryClient.prefetchQuery(__entity__Service.options.list(deps)),
	component: __Entity__ListPage
});

function __Entity__ListPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const [creating, setCreating] = useState(false);

	return (
		<>
			<PageHeader
				title={__entity__TableView.title}
				actions={
					<Button onClick={() => setCreating(true)}>
						<Plus /> New __label__
					</Button>
				}
			/>
			<QueryTable
				view={__entity__TableView}
				params={paramsFromSearch(__entity__TableView, search)}
				onParamsChange={next => navigate({ search: searchFromParams(next), replace: true })}
			/>
			<__Entity__FormSheet open={creating} onOpenChange={setCreating} />
		</>
	);
}
