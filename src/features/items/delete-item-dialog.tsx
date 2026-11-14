import { Trash2 } from 'lucide-react';

import { describeError } from '@/shared/models/app-error/describe-error';
import { ActionDialog } from '@/shared/ui/feedback/action-dialog';
import { Alert } from '@/shared/ui/feedback/alert';

import { itemService } from './service';
import type { Item } from './types';

export function DeleteItemDialog({
	item,
	open,
	onOpenChange,
	onDeleted
}: {
	item: Item;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted?: () => void;
}) {
	const remove = itemService.hooks.useRemove();

	return (
		<ActionDialog
			open={open}
			onOpenChange={o => {
				if (!o) remove.reset();
				onOpenChange(o);
			}}
			icon={Trash2}
			destructive
			title="Delete this item?"
			subject={item.name}
			confirmLabel="Delete"
			busy={remove.isPending}
			onSubmit={e => {
				e.preventDefault();
				remove.mutate(item.id, {
					onSuccess: () => {
						onOpenChange(false);
						onDeleted?.();
					}
				});
			}}
		>
			<p className="text-sm text-muted-foreground">This cannot be undone.</p>
			{remove.error && <Alert tone="error" title={describeError(remove.error)} />}
		</ActionDialog>
	);
}
