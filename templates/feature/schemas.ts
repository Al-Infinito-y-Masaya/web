import { z } from 'zod';

import type { __Entity__ } from './types';

/** Form schema shared by the create/edit forms. Mirror your create payload here. */
export const __entity__FormSchema = z.object({
	name: z.string().trim().min(1, 'Name is required')
});

export type __Entity__FormInput = z.input<typeof __entity__FormSchema>;

export const empty__Entity__Form: __Entity__FormInput = { name: '' };

export function __entity__ToForm(row: __Entity__): __Entity__FormInput {
	return { name: row.name };
}
