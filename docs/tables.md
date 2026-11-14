# Tables

The list UI is declarative: a feature describes its table once in a `TableView`, and the page wires it to the URL.

## Define the view (feature)

```tsx
// features/items/table-view.tsx
const columns = defineColumns<Item>([
	{ id: 'name', label: 'Name', sortKey: 'name', hideable: false, render: i => i.name },
	{ id: 'quantity', label: 'Qty', sortKey: 'quantity', align: 'right', render: i => formatNumber(i.quantity) },
	{ id: 'notes', label: 'Notes', defaultHidden: true, render: i => i.description }
]);

const f = createFilters<ItemListParams>();
const filters = f.define([
	f.enum({ param: 'status', label: 'Status', labels: itemStatusLabels }),
	f.boolean({ param: 'archived', label: 'Archived' }),
	f.query({ param: 'category', label: 'Category', source: categoryService, mapper: c => ({ label: c.name, value: c.id }) })
]);

export const itemTableView = defineTableView<Item, ItemListParams>({
	title: 'Items', singular: 'item', itemLabel: 'items',
	service: itemService, getRowId: i => i.id,
	columns, filters,
	detail,               // optional quick-view sheet on row click
	rowLink: i => (...),  // or: navigate on row click
	form: ItemFormSheet,  // optional: adds "Edit" to rows and the quick view
	columnsKey: 'items',  // optional: "Columns" menu, remembered per browser
	empty: () => <EmptyState … />
});
```

Column options: `sortKey` (sends `order=key` / `order=-key`), `align: 'right'`, `defaultHidden`, `hideable: false`, `className`.

## Use it (route)

```tsx
export const Route = createFileRoute('/_app/items/')({
	validateSearch: (search): Record<string, unknown> => search,
	loaderDeps: ({ search }) => paramsFromSearch(itemTableView, search),
	loader: ({ context, deps }) =>
		context.queryClient.prefetchQuery(itemService.options.list(deps)),
	component: () => {
		const search = Route.useSearch();
		const navigate = Route.useNavigate();
		return (
			<QueryTable
				view={itemTableView}
				params={paramsFromSearch(itemTableView, search)}
				onParamsChange={next => navigate({ search: searchFromParams(next), replace: true })}
			/>
		);
	}
});
```

`paramsFromSearch` only lets through params the view declares (known sort keys, known filters, valid enum values), so a hand-edited URL never sends garbage to the API. `searchFromParams` drops defaults for clean URLs.

## Included behaviour

Debounced search (300 ms), sortable headers with `aria-sort`, filters with "More filters" for `advanced: true`, column visibility menu, page-size selector, pagination with ellipses, skeleton rows on first load, dimmed rows while refetching, error row with retry, "no results" with clear search/filters, keyboard-accessible clickable rows.

## Lower-level pieces

- `PaginatedTable` — the presentational table; bring your own data and params.
- `LocalQueryTable` — params in local state, for secondary lists inside another page.
- `DetailSheet` / `defineDetail` — the quick-view panel.
