import { Link } from '@tanstack/react-router';
import { Package } from 'lucide-react';

import { defineDetail } from '@/shared/ui/data/detail/detail-sheet';
import { Status } from '@/shared/ui/data/status-badge';
import { defineColumns } from '@/shared/ui/data/table/paginated-table';
import { createFilters } from '@/shared/ui/data/table/table-filters';
import { defineTableView } from '@/shared/ui/data/table/table-view';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { Button } from '@/shared/ui/primitives/button';
import { formatDate, formatDateTime, formatNumber } from '@/shared/utils/format';

import { ItemFormSheet } from './item-form-sheet';
import { itemStatusLabels, itemStatusTones } from './labels';
import { itemService } from './service';
import type { Item, ItemListParams } from './types';

const columns = defineColumns<Item>([
	{
		id: 'name',
		label: 'Name',
		sortKey: 'name',
		hideable: false,
		render: item => <span className="font-medium">{item.name}</span>
	},
	{
		id: 'status',
		label: 'Status',
		render: item => (
			<Status tone={itemStatusTones[item.status]}>{itemStatusLabels[item.status]}</Status>
		)
	},
	{
		id: 'quantity',
		label: 'Quantity',
		sortKey: 'quantity',
		align: 'right',
		render: item => formatNumber(item.quantity)
	},
	{
		id: 'created_at',
		label: 'Created',
		sortKey: 'created_at',
		render: item => formatDate(item.created_at)
	},
	{
		id: 'description',
		label: 'Description',
		defaultHidden: true,
		className: 'max-w-80 truncate',
		render: item => item.description
	}
]);

const f = createFilters<ItemListParams>();
const filters = f.define([f.enum({ param: 'status', label: 'Status', labels: itemStatusLabels })]);

const detail = defineDetail<Item>({
	title: item => item.name,
	badges: item => (
		<Status tone={itemStatusTones[item.status]}>{itemStatusLabels[item.status]}</Status>
	),
	fields: [
		{ label: 'Quantity', render: item => formatNumber(item.quantity) },
		{ label: 'Created', render: item => formatDateTime(item.created_at) },
		{ label: 'Updated', render: item => formatDateTime(item.updated_at) },
		{ label: 'Description', span: 2, render: item => item.description }
	],
	actions: item => (
		<Button variant="outline" asChild>
			<Link to="/items/$itemId" params={{ itemId: item.id }}>
				Open page
			</Link>
		</Button>
	)
});

/** Everything the items list page needs; the route only wires params to the URL. */
export const itemTableView = defineTableView<Item, ItemListParams>({
	title: 'Items',
	description: 'Everything in your catalog.',
	singular: 'item',
	itemLabel: 'items',
	searchPlaceholder: 'Search items…',
	service: itemService,
	getRowId: item => item.id,
	columns,
	filters,
	detail,
	form: ItemFormSheet,
	columnsKey: 'items',
	empty: () => (
		<EmptyState
			icon={Package}
			title="No items yet"
			description="Items you create will show up here."
			actions={
				<Button asChild>
					<Link to="/items/new">Create item</Link>
				</Button>
			}
		/>
	)
});
