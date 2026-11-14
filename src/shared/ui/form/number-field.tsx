import type { FieldValues } from 'react-hook-form';

import { InputField, type InputFieldProps } from './input-field';

/** Numeric input. An empty input sets the value to `undefined` (use `z.number().optional()`). */
export function NumberField<TValues extends FieldValues>(
	props: Omit<InputFieldProps<TValues>, 'parse' | 'type'>
) {
	return (
		<InputField
			inputMode="decimal"
			{...props}
			type="number"
			parse={raw => (raw === '' ? undefined : Number(raw))}
		/>
	);
}
