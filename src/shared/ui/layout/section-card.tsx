import type { ReactNode } from 'react';

import { cn } from '@/shared/utils';

/** Content card: title, optional action on the right ("View all") and body. */
export function SectionCard({
	title,
	description,
	action,
	children,
	className
}: {
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section className={cn('flex flex-col gap-4 rounded-xl border bg-card p-5', className)}>
			<header className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<h2 className="text-base font-semibold">{title}</h2>
					{description && <p className="text-sm text-muted-foreground">{description}</p>}
				</div>
				{action && (
					<div className="shrink-0 text-sm font-medium text-primary [&_a:hover]:underline">
						{action}
					</div>
				)}
			</header>
			{children}
		</section>
	);
}

/** Labelled value: "Status / Active". */
export function DataItem({
	label,
	children,
	hint,
	className
}: {
	label: ReactNode;
	children: ReactNode;
	hint?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('flex min-w-0 flex-col gap-1', className)}>
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-sm break-words">{children ?? '—'}</span>
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</div>
	);
}

/** Responsive grid of `DataItem`s. */
export function DataGrid({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div
			className={cn(
				'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-4',
				className
			)}
		>
			{children}
		</div>
	);
}

/** Highlighted figure ("Total items 135"). */
export function StatCard({
	label,
	value,
	hint,
	icon
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
			<span className="flex items-center justify-between text-xs text-muted-foreground">
				{label}
				{icon && <span className="[&>svg]:size-4">{icon}</span>}
			</span>
			<span className="text-2xl font-semibold tabular-nums">{value}</span>
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</div>
	);
}
