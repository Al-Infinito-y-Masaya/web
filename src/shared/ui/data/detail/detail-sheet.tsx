import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/primitives/sheet';
import { cn } from '@/shared/utils';

/*
 * ============================================================================
 * Definition
 * ============================================================================
 */

export type DetailField<T> = {
	label: string;
	render: (row: T) => ReactNode;
	/** 2 = spans the whole row (descriptions, long values). */
	span?: 1 | 2;
};

export type DetailSection<T> = {
	title: string;
	render: (row: T) => ReactNode;
};

/** Quick view of a record, declared next to its columns in `table-view.tsx`. */
export type DetailView<T> = {
	title: (row: T) => ReactNode;
	/** Badges under the title (status, type…). */
	badges?: (row: T) => ReactNode;
	fields: DetailField<T>[];
	/** Blocks under the fields, e.g. related records. */
	sections?: DetailSection<T>[];
	/** Note at the end of the body; `null` to hide it. */
	note?: (row: T) => ReactNode;
	/** Footer buttons. Without them there is no footer. */
	actions?: (row: T) => ReactNode;
};

export function defineDetail<T>(detail: DetailView<T>) {
	return detail;
}

/*
 * ============================================================================
 * Render
 * ============================================================================
 */

type DetailSheetProps<T> = {
	detail: DetailView<T>;
	/** Small text above the title ("Item details"). */
	eyebrow: string;
	/** Kept after closing so the exit animation has content. */
	row: T | undefined;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Refreshing with the backend detail (the list row is already shown). */
	isFetching?: boolean;
	error?: Error | null;
};

export function DetailSheet<T>({
	detail,
	eyebrow,
	row,
	open,
	onOpenChange,
	isFetching,
	error
}: DetailSheetProps<T>) {
	const note = row && detail.note?.(row);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				{row && (
					<>
						<header className="border-b px-6 pt-5 pr-14 pb-4">
							<p className="text-xs text-muted-foreground">{eyebrow}</p>
							<SheetTitle className="mt-1">{detail.title(row)}</SheetTitle>
							{detail.badges && (
								<div className="mt-2 flex flex-wrap items-center gap-2">
									{detail.badges(row)}
								</div>
							)}
						</header>

						<div
							className={cn(
								'flex-1 overflow-y-auto px-6 py-5 transition-opacity',
								isFetching && 'opacity-70'
							)}
							aria-busy={isFetching}
						>
							{error && (
								<p
									role="alert"
									className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
								>
									Could not refresh the details: {error.message}
								</p>
							)}

							<dl className="grid grid-cols-2 gap-x-6 gap-y-4">
								{detail.fields.map(field => (
									<div
										key={field.label}
										className={cn('min-w-0', field.span === 2 && 'col-span-2')}
									>
										<dt className="text-xs text-muted-foreground">
											{field.label}
										</dt>
										<dd className="mt-0.5 text-sm break-words">
											{field.render(row) ?? '—'}
										</dd>
									</div>
								))}
							</dl>

							{detail.sections?.map(section => (
								<section key={section.title} className="mt-7">
									<h3 className="text-base font-semibold">{section.title}</h3>
									<div className="mt-3">{section.render(row)}</div>
								</section>
							))}

							{note && (
								<p className="mt-6 flex gap-2 text-xs text-muted-foreground">
									<Info
										aria-hidden
										className="mt-px size-3.5 shrink-0 text-primary"
									/>
									<span>{note}</span>
								</p>
							)}
						</div>

						{detail.actions && (
							<footer className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">
								{detail.actions(row)}
							</footer>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}

/** List of related records for a section ("Recent orders"…). */
export function DetailList({
	children,
	empty,
	isLoading
}: {
	children: ReactNode;
	empty?: boolean;
	isLoading?: boolean;
}) {
	if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
	if (empty) return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;
	return <ul className="divide-y">{children}</ul>;
}

export function DetailListItem({
	title,
	subtitle,
	aside
}: {
	title: ReactNode;
	subtitle?: ReactNode;
	aside?: ReactNode;
}) {
	return (
		<li className="flex items-center justify-between gap-4 py-3">
			<div className="min-w-0">
				<p className="truncate text-sm font-semibold">{title}</p>
				{subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
			</div>
			{aside && <div className="shrink-0 text-sm font-semibold">{aside}</div>}
		</li>
	);
}
