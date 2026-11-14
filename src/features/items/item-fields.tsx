import { NumberField, SelectField, TextareaField, TextField } from '@/shared/ui/form';
import type { FormControl } from '@/shared/ui/form/types';

import { itemStatusOptions } from './labels';
import type { ItemFormInput } from './schemas';

/** The item form's fields, shared by the create page and the edit sheet. */
export function ItemFields({ control }: { control: FormControl<ItemFormInput> }) {
	return (
		<>
			<TextField control={control} name="name" label="Name" placeholder="Blue widget" />
			<TextareaField
				control={control}
				name="description"
				label="Description"
				description="Optional. Shown on the item page."
				rows={4}
			/>
			<div className="grid gap-5 sm:grid-cols-2">
				<SelectField
					control={control}
					name="status"
					label="Status"
					options={itemStatusOptions}
				/>
				<NumberField control={control} name="quantity" label="Quantity" min={0} step={1} />
			</div>
		</>
	);
}
