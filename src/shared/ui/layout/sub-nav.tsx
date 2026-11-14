import { Link, type LinkOptions } from '@tanstack/react-router';

import { cn } from '@/shared/utils';

export type SubNavItem = {
	label: string;
	/** Without `link` the item is shown disabled (e.g. not built yet). */
	link?: LinkOptions;
	/** Active only on the exact route. */
	exact?: boolean;
};

/** Section sub-navigation as pills (Overview · Activity · Settings…). Each item is a route. */
export function SubNav({ items, label }: { items: SubNavItem[]; label: string }) {
	const base =
		'shrink-0 rounded-full px-3 py-1.5 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring';
	return (
		<nav aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
			{items.map(item =>
				item.link ? (
					<Link
						key={item.label}
						{...item.link}
						activeOptions={{ exact: item.exact, includeSearch: false }}
						className={cn(
							base,
							'text-muted-foreground hover:bg-muted hover:text-foreground data-[status=active]:bg-info data-[status=active]:font-bold data-[status=active]:text-info-foreground'
						)}
					>
						{item.label}
					</Link>
				) : (
					<span
						key={item.label}
						aria-disabled
						title={`${item.label} (coming soon)`}
						className={cn(base, 'cursor-not-allowed text-muted-foreground/50')}
					>
						{item.label}
					</span>
				)
			)}
		</nav>
	);
}
