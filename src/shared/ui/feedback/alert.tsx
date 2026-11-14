import { cva, type VariantProps } from 'class-variance-authority';
import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/utils';

const alertVariants = cva('flex w-full gap-3 rounded-lg border px-4 py-3 text-sm', {
	variants: {
		tone: {
			error: 'border-destructive/30 bg-destructive/10 text-destructive',
			warning: 'border-warning-border bg-warning text-warning-foreground',
			success: 'border-success-foreground/20 bg-success text-success-foreground',
			info: 'border-info-foreground/20 bg-info text-info-foreground'
		}
	},
	defaultVariants: { tone: 'info' }
});

export type AlertTone = NonNullable<VariantProps<typeof alertVariants>['tone']>;

const ICONS: Record<AlertTone, LucideIcon> = {
	error: CircleX,
	warning: TriangleAlert,
	success: CircleCheck,
	info: Info
};

/** Inline message with a tone, an optional description and an action on the right. */
export function Alert({
	tone = 'info',
	title,
	icon,
	action,
	className,
	children,
	...props
}: Omit<ComponentProps<'div'>, 'title'> & {
	tone?: AlertTone;
	title: ReactNode;
	icon?: LucideIcon;
	action?: ReactNode;
}) {
	const Icon = icon ?? ICONS[tone];
	return (
		<div
			role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
			className={cn(alertVariants({ tone }), className)}
			{...props}
		>
			<Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
			<div className="min-w-0 flex-1">
				<p className="font-semibold">{title}</p>
				{children && <div className="mt-0.5 opacity-90">{children}</div>}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
