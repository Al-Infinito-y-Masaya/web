import { useRef, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/shared/utils';

export type TabItem<V extends string> = {
	value: V;
	label: string;
	/** Counter next to the label ("Drafts 4"). */
	count?: number;
};

/**
 * Accessible tabs (ARIA tablist with arrow-key navigation). Controlled, so the
 * page decides where the active tab lives (URL search param, state…). The page
 * renders the content inside `<TabPanel>`.
 */
export function Tabs<V extends string>({
	items,
	value,
	onChange,
	label,
	idPrefix = 'tab'
}: {
	items: TabItem<V>[];
	value: V;
	onChange: (value: V) => void;
	/** Accessible name of the list ("Item sections"). */
	label: string;
	idPrefix?: string;
}) {
	const refs = useRef<(HTMLButtonElement | null)[]>([]);

	// Arrow keys move between tabs (ARIA tablist pattern).
	const onKeyDown = (e: KeyboardEvent, index: number) => {
		const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
		if (!delta) return;
		e.preventDefault();
		const next = (index + delta + items.length) % items.length;
		refs.current[next]?.focus();
		onChange(items[next].value);
	};

	return (
		<div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b">
			{items.map((item, i) => {
				const active = item.value === value;
				return (
					<button
						key={item.value}
						ref={el => {
							refs.current[i] = el;
						}}
						id={`${idPrefix}-${item.value}`}
						role="tab"
						type="button"
						aria-selected={active}
						aria-controls={`${idPrefix}-panel`}
						tabIndex={active ? 0 : -1}
						onClick={() => onChange(item.value)}
						onKeyDown={e => onKeyDown(e, i)}
						className={cn(
							'-mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring',
							active
								? 'border-primary font-bold text-primary'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						)}
					>
						{item.label}
						{item.count != null && (
							<span
								className={cn(
									'rounded-full px-2 py-px text-xs font-bold',
									active
										? 'bg-info text-info-foreground'
										: 'bg-muted text-foreground'
								)}
							>
								{item.count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

export function TabPanel({
	value,
	idPrefix = 'tab',
	children
}: {
	value: string;
	idPrefix?: string;
	children: ReactNode;
}) {
	return (
		<div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-${value}`}>
			{children}
		</div>
	);
}
