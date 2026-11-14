import { LoaderCircle } from 'lucide-react';
import { useState, type FormEventHandler, type ReactNode } from 'react';

import { LeaveConfirmDialog } from '@/shared/ui/feedback/unsaved-changes';
import { Button } from '@/shared/ui/primitives/button';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/shared/ui/primitives/sheet';

/**
 * Form in a side panel: header, scrollable fields and a Cancel / Save footer.
 * The form itself (react-hook-form) belongs to the caller.
 */
export function FormSheet({
	open,
	onOpenChange,
	eyebrow,
	title,
	description,
	onSubmit,
	submitting,
	submitLabel = 'Save',
	submitDisabled,
	dirty,
	children
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eyebrow?: string;
	title: string;
	description?: string;
	onSubmit: FormEventHandler<HTMLFormElement>;
	submitting?: boolean;
	submitLabel?: string;
	submitDisabled?: boolean;
	/** With unsaved changes, closing asks for confirmation. */
	dirty?: boolean;
	children: ReactNode;
}) {
	const [confirming, setConfirming] = useState(false);
	const change = (next: boolean) => {
		if (!next && dirty && !submitting) return setConfirming(true);
		onOpenChange(next);
	};

	return (
		<>
			<LeaveConfirmDialog
				open={confirming}
				onStay={() => setConfirming(false)}
				onLeave={() => {
					setConfirming(false);
					onOpenChange(false);
				}}
			/>
			<Sheet open={open} onOpenChange={change}>
				<SheetContent>
					<form noValidate onSubmit={onSubmit} className="flex h-full flex-col">
						<header className="border-b px-6 pt-5 pr-14 pb-4">
							{eyebrow && <p className="text-xs text-muted-foreground">{eyebrow}</p>}
							<SheetTitle className="mt-1">{title}</SheetTitle>
							{description && (
								<p className="mt-1 text-sm text-muted-foreground">{description}</p>
							)}
						</header>
						<div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
							{children}
						</div>
						<footer className="flex justify-end gap-2 border-t px-6 py-4">
							<SheetClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</SheetClose>
							<Button type="submit" disabled={submitting || submitDisabled}>
								{submitting && (
									<LoaderCircle aria-hidden className="animate-spin" />
								)}
								{submitLabel}
							</Button>
						</footer>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}
