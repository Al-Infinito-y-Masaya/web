import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { ItemFields } from '@/features/items/item-fields';
import { emptyItemForm, itemFormSchema } from '@/features/items/schemas';
import { itemService } from '@/features/items/service';
import { UnsavedChangesGuard } from '@/shared/ui/feedback/unsaved-changes';
import { FormErrorAlert, useZodForm } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout/page-header';
import { Button } from '@/shared/ui/primitives/button';
import { Spinner } from '@/shared/ui/primitives/spinner';

/**
 * FORM PAGE TEMPLATE
 * A full-page create form: Zod validation, server errors mapped onto fields,
 * an unsaved-changes guard, and a redirect to the new record on success.
 */
export const Route = createFileRoute('/_app/items/new')({
	component: NewItemPage
});

function NewItemPage() {
	const navigate = useNavigate();
	const create = itemService.hooks.useCreate();

	const { control, submit, isSubmitting, isDirty } = useZodForm({
		schema: itemFormSchema,
		defaultValues: emptyItemForm,
		onSubmit: values => create.mutateAsync(values),
		onSuccess: item => navigate({ to: '/items/$itemId', params: { itemId: item.id } })
	});

	return (
		<>
			<PageHeader
				title="New item"
				crumbs={[{ label: 'Items', link: { to: '/items' } }, { label: 'New item' }]}
			/>
			<form
				noValidate
				onSubmit={submit}
				className="flex max-w-2xl flex-col gap-5 rounded-xl border bg-card p-6"
			>
				<FormErrorAlert control={control} />
				<ItemFields control={control} />
				<div className="flex justify-end gap-2 border-t pt-5">
					<Button variant="outline" asChild>
						<Link to="/items">Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Spinner />}
						Create item
					</Button>
				</div>
			</form>
			<UnsavedChangesGuard dirty={isDirty} saving={isSubmitting} />
		</>
	);
}
