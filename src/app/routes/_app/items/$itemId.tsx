import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DeleteItemDialog } from '@/features/items/delete-item-dialog';
import { ItemFormSheet } from '@/features/items/item-form-sheet';
import { itemStatusLabels, itemStatusTones } from '@/features/items/labels';
import { itemService } from '@/features/items/service';
import { AppException } from '@/shared/models/app-error/app-error';
import { Status } from '@/shared/ui/data/status-badge';
import { PageSkeleton } from '@/shared/ui/feedback/page-skeleton';
import { PageHeader } from '@/shared/ui/layout/page-header';
import { DataGrid, DataItem, SectionCard } from '@/shared/ui/layout/section-card';
import { Button } from '@/shared/ui/primitives/button';
import { formatDateTime, formatNumber } from '@/shared/utils/format';

/**
 * DETAIL PAGE TEMPLATE
 * The loader fills the query cache before render (and turns a 404 into the
 * not-found page); the component reads it with `useSuspenseQuery`, so `data`
 * is always defined and stays in sync after edits.
 */
export const Route = createFileRoute('/_app/items/$itemId')({
	loader: async ({ context, params }) => {
		try {
			const item = await context.queryClient.ensureQueryData(
				itemService.options.detail(params.itemId)
			);
			return { crumb: item.name };
		} catch (error) {
			if (error instanceof AppException && error.error.kind === 'notFound') throw notFound();
			throw error;
		}
	},
	pendingComponent: () => <PageSkeleton stats={0} rows={3} />,
	component: ItemPage
});

function ItemPage() {
	const { itemId } = Route.useParams();
	const navigate = useNavigate();
	const { data: item } = useSuspenseQuery(itemService.options.detail(itemId));
	const [editing, setEditing] = useState(false);
	const [deleting, setDeleting] = useState(false);

	return (
		<>
			<PageHeader
				title={item.name}
				crumbs={[{ label: 'Items', link: { to: '/items' } }, { label: item.name }]}
				badges={
					<Status tone={itemStatusTones[item.status]}>
						{itemStatusLabels[item.status]}
					</Status>
				}
				actions={
					<>
						<Button variant="outline" onClick={() => setDeleting(true)}>
							<Trash2 /> Delete
						</Button>
						<Button onClick={() => setEditing(true)}>
							<Pencil /> Edit
						</Button>
					</>
				}
			/>

			<SectionCard title="Details">
				<DataGrid>
					<DataItem label="Status">{itemStatusLabels[item.status]}</DataItem>
					<DataItem label="Quantity">{formatNumber(item.quantity)}</DataItem>
					<DataItem label="Created">{formatDateTime(item.created_at)}</DataItem>
					<DataItem label="Last updated">{formatDateTime(item.updated_at)}</DataItem>
				</DataGrid>
			</SectionCard>

			<SectionCard title="Description">
				<p className="text-sm whitespace-pre-line text-muted-foreground">
					{item.description || 'No description.'}
				</p>
			</SectionCard>

			<ItemFormSheet row={item} open={editing} onOpenChange={setEditing} />
			<DeleteItemDialog
				item={item}
				open={deleting}
				onOpenChange={setDeleting}
				onDeleted={() => navigate({ to: '/items' })}
			/>
		</>
	);
}
