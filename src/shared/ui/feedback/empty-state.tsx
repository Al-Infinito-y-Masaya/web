import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/utils';

/** "Nothing here yet" block: icon in a circle, title, explanation and actions. */
export function EmptyState({
	icon: Icon = Inbox,
	title,
	description,
	actions,
	className
}: {
	icon?: LucideIcon;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
			<div className="flex size-14 items-center justify-center rounded-full bg-muted">
				<Icon aria-hidden className="size-6 text-muted-foreground" />
			</div>
			<p className="text-base font-semibold">{title}</p>
			{description && (
				<p className="max-w-[520px] text-sm text-muted-foreground">{description}</p>
			)}
			{actions && <div className="mt-1 flex flex-wrap justify-center gap-3">{actions}</div>}
		</div>
	);
}
