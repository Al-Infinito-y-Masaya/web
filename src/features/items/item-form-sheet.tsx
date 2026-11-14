import { useMemo } from 'react';

import type { RowFormProps } from '@/shared/ui/data/table/table-view';
import { FormErrorAlert, FormSheet, useZodForm } from '@/shared/ui/form';

import { ItemFields } from './item-fields';
import { emptyItemForm, itemFormSchema, itemToForm } from './schemas';
import { itemService } from './service';
import type { Item } from './types';

/** Create (no `row`) or edit (with `row`) an item in a side panel. */
export function ItemFormSheet({ row, open, onOpenChange }: RowFormProps<Item>) {
	const create = itemService.hooks.useCreate();
	const update = itemService.hooks.useUpdate();
	const values = useMemo(() => (row ? itemToForm(row) : emptyItemForm), [row]);

	const { control, submit, isSubmitting, isDirty } = useZodForm({
		schema: itemFormSchema,
		values,
		onSubmit: payload =>
			row ? update.mutateAsync({ id: row.id, payload }) : create.mutateAsync(payload),
		onSuccess: () => onOpenChange(false)
	});

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			eyebrow={row ? 'Edit item' : 'New item'}
			title={row ? row.name : 'Create an item'}
			onSubmit={submit}
			submitting={isSubmitting}
			submitLabel={row ? 'Save changes' : 'Create item'}
			dirty={isDirty}
		>
			<FormErrorAlert control={control} />
			<ItemFields control={control} />
		</FormSheet>
	);
}
