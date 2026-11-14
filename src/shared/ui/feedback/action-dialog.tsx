import { LoaderCircle, type LucideIcon } from 'lucide-react';
import type { FormEventHandler, ReactNode } from 'react';

import { Button } from '@/shared/ui/primitives/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/shared/ui/primitives/dialog';
import { cn } from '@/shared/utils';

/**
 * Confirmation modal for actions with consequences (delete, publish, cancel…):
 * icon, title, subject, scrollable body and a Cancel / Confirm footer. It wraps
 * a `<form>` so the body can hold fields.
 */
export function ActionDialog({
	open,
	onOpenChange,
	icon: Icon,
	title,
	subject,
	children,
	confirmLabel,
	cancelLabel = 'Cancel',
	destructive,
	busy,
	confirmDisabled,
	onSubmit
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	icon?: LucideIcon;
	title: string;
	/** What the action applies to ("Item: Blue widget"). */
	subject?: ReactNode;
	children?: ReactNode;
	confirmLabel: string;
	cancelLabel?: string;
	destructive?: boolean;
	busy?: boolean;
	confirmDisabled?: boolean;
	onSubmit: FormEventHandler<HTMLFormElement>;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-col">
					<header className="flex items-start gap-3 px-5 pt-5 pr-14">
						{Icon && (
							<span
								className={cn(
									'flex size-9 shrink-0 items-center justify-center rounded-lg',
									destructive
										? 'bg-destructive/10 text-destructive'
										: 'bg-info text-info-foreground'
								)}
							>
								<Icon aria-hidden className="size-5" />
							</span>
						)}
						<div className="min-w-0">
							<DialogTitle>{title}</DialogTitle>
							{subject && <p className="text-sm text-muted-foreground">{subject}</p>}
						</div>
					</header>
					{children && (
						<div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4">
							{children}
						</div>
					)}
					<footer className="mt-4 flex justify-end gap-2 border-t bg-muted/40 px-5 py-4">
						<DialogClose asChild>
							<Button type="button" variant="outline">
								{cancelLabel}
							</Button>
						</DialogClose>
						<Button
							type="submit"
							disabled={busy || confirmDisabled}
							className={cn(
								destructive && 'bg-destructive text-white hover:bg-destructive/90'
							)}
						>
							{busy && <LoaderCircle aria-hidden className="animate-spin" />}
							{confirmLabel}
						</Button>
					</footer>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/** Two-column summary list ("Impact of this action" and similar). */
export function KeyValueList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
	return (
		<dl className="divide-y overflow-hidden rounded-lg border">
			{items.map((item, i) => (
				<div
					key={i}
					className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
				>
					<dt className="text-muted-foreground">{item.label}</dt>
					<dd className="text-right font-semibold">{item.value}</dd>
				</div>
			))}
		</dl>
	);
}
