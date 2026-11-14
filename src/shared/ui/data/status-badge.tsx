import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/shared/utils';

/*
 * Status pill. Color is never the only signal: it always comes with text (and
 * a dot, except for outline tags).
 *  - neutral : no judgement ("Draft")
 *  - info    : in progress ("Processing")
 *  - success : resolved ("Active", "Approved")
 *  - warning : needs attention ("Pending review")
 *  - outline : neutral tags ("Imported")
 *  - danger  : cancelled or failed ("Cancelled")
 */
const statusVariants = cva(
	'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-4 font-bold whitespace-nowrap',
	{
		variants: {
			tone: {
				neutral: 'bg-muted text-foreground',
				info: 'bg-info text-info-foreground',
				success: 'bg-success text-success-foreground',
				warning: 'border border-warning-border bg-warning text-warning-foreground',
				outline: 'border border-border bg-card text-foreground',
				danger: 'bg-destructive/10 text-destructive'
			}
		},
		defaultVariants: { tone: 'neutral' }
	}
);

export type StatusTone = NonNullable<VariantProps<typeof statusVariants>['tone']>;

const DOT: Record<StatusTone, string> = {
	neutral: 'bg-muted-foreground',
	info: 'bg-info-foreground',
	success: 'bg-success-foreground',
	warning: 'bg-warning-border',
	outline: 'bg-muted-foreground',
	danger: 'bg-destructive'
};

export function Status({
	tone = 'neutral',
	dot = tone !== 'outline',
	className,
	children
}: {
	tone?: StatusTone;
	/** Every tone has a dot by default except `outline`. */
	dot?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return (
		<span className={cn(statusVariants({ tone }), className)}>
			{dot && (
				<span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT[tone])} />
			)}
			{children}
		</span>
	);
}

/** Active / inactive. */
export function StatusBadge({
	active,
	activeLabel = 'Active',
	inactiveLabel = 'Inactive'
}: {
	active: boolean;
	activeLabel?: string;
	inactiveLabel?: string;
}) {
	return (
		<Status tone={active ? 'success' : 'neutral'}>
			{active ? activeLabel : inactiveLabel}
		</Status>
	);
}

/** Neutral tag for enums and categories. */
export function Tag({ children }: { children: ReactNode }) {
	return <Status tone="outline">{children}</Status>;
}
