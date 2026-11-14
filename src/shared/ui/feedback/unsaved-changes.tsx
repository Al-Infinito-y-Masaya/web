import { useBlocker } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { ActionDialog } from './action-dialog';

/**
 * Guards a form page: while `dirty`, navigating away asks for confirmation and
 * closing the tab shows the browser prompt. It does not block while saving, so
 * the redirect after a successful save goes straight through.
 *
 * ```tsx
 * <UnsavedChangesGuard dirty={form.formState.isDirty} saving={mutation.isPending} />
 * ```
 */
export function UnsavedChangesGuard({
	dirty,
	saving = false
}: {
	dirty: boolean;
	saving?: boolean;
}) {
	// The decision happens at navigation time: read the latest state, not the one from the render that created the blocker.
	const active = useRef(false);
	useEffect(() => {
		active.current = dirty && !saving;
	}, [dirty, saving]);
	const blocker = useBlocker({
		shouldBlockFn: ({ current, next }) => active.current && current.pathname !== next.pathname,
		enableBeforeUnload: () => active.current,
		withResolver: true
	});

	return (
		<LeaveConfirmDialog
			open={blocker.status === 'blocked'}
			onLeave={() => blocker.proceed?.()}
			onStay={() => blocker.reset?.()}
		/>
	);
}

/** "Discard changes?" confirmation. Also used by `FormSheet` when closed while dirty. */
export function LeaveConfirmDialog({
	open,
	onLeave,
	onStay
}: {
	open: boolean;
	onLeave: () => void;
	onStay: () => void;
}) {
	return (
		<ActionDialog
			open={open}
			onOpenChange={o => !o && onStay()}
			icon={TriangleAlert}
			destructive
			title="You have unsaved changes"
			subject="If you leave now, the changes in this form will be lost."
			confirmLabel="Discard changes"
			cancelLabel="Keep editing"
			onSubmit={e => {
				e.preventDefault();
				onLeave();
			}}
		/>
	);
}
