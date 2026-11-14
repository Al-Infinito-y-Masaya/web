import type { LinkOptions } from '@tanstack/react-router';

import { defineColumns } from '@/shared/ui/data/table/paginated-table';
import { defineTableView } from '@/shared/ui/data/table/table-view';

import { __Entity__FormSheet } from './form-sheet';
import { __entity__Service } from './service';
import type { __Entity__, __Entity__ListParams } from './types';

const columns = defineColumns<__Entity__>([
	{
		id: 'name',
		label: 'Name',
		sortKey: 'name',
		hideable: false,
		render: row => <span className="font-medium">{row.name}</span>
	}
]);

export const __entity__TableView = defineTableView<__Entity__, __Entity__ListParams>({
	title: '__Title__',
	singular: '__label__',
	itemLabel: '__labels__',
	service: __entity__Service,
	getRowId: row => row.id,
	columns,
	form: __Entity__FormSheet,
	// The explicit return type avoids a circular inference with the route files.
	rowLink: (row): LinkOptions => ({ to: '/__route__/$id', params: { id: row.id } })
});
