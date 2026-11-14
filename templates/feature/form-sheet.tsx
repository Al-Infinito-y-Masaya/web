import { useMemo } from 'react';

import type { RowFormProps } from '@/shared/ui/data/table/table-view';
import { FormErrorAlert, FormSheet, useZodForm } from '@/shared/ui/form';

import { __Entity__Fields } from './fields';
import { __entity__FormSchema, __entity__ToForm, empty__Entity__Form } from './schemas';
import { __entity__Service } from './service';
import type { __Entity__ } from './types';

/** Create (no `row`) or edit (with `row`) in a side panel. */
export function __Entity__FormSheet({ row, open, onOpenChange }: RowFormProps<__Entity__>) {
	const create = __entity__Service.hooks.useCreate();
	const update = __entity__Service.hooks.useUpdate();
	const values = useMemo(() => (row ? __entity__ToForm(row) : empty__Entity__Form), [row]);

	const { control, submit, isSubmitting, isDirty } = useZodForm({
		schema: __entity__FormSchema,
		values,
		onSubmit: payload =>
			row ? update.mutateAsync({ id: row.id, payload }) : create.mutateAsync(payload),
		onSuccess: () => onOpenChange(false)
	});

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			eyebrow={row ? 'Edit __label__' : 'New __label__'}
			title={row ? row.name : 'Create __label__'}
			onSubmit={submit}
			submitting={isSubmitting}
			dirty={isDirty}
		>
			<FormErrorAlert control={control} />
			<__Entity__Fields control={control} />
		</FormSheet>
	);
}
