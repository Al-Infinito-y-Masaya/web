import { z } from 'zod';

import type { Item, ItemCreate } from './types';

/** Form schema shared by the create page and the edit sheet. */
export const itemFormSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(120, 'Keep it under 120 characters'),
	description: z
		.string()
		.trim()
		.max(1000, 'Keep it under 1000 characters')
		.transform(v => v || null),
	status: z.enum(['draft', 'active', 'archived']),
	quantity: z.number('Enter a number').int('Use a whole number').min(0, 'Cannot be negative')
}) satisfies z.ZodType<ItemCreate, unknown>;

export type ItemFormInput = z.input<typeof itemFormSchema>;

export const emptyItemForm: ItemFormInput = {
	name: '',
	description: '',
	status: 'draft',
	quantity: 0
};

export function itemToForm(item: Item): ItemFormInput {
	return {
		name: item.name,
		description: item.description ?? '',
		status: item.status,
		quantity: item.quantity
	};
}
