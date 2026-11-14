import type { FieldValues } from 'react-hook-form';

import { InputField, type InputFieldProps } from './input-field';

/** Native date picker. The value is a `YYYY-MM-DD` string (empty string when cleared). */
export function DateField<TValues extends FieldValues>(
	props: Omit<InputFieldProps<TValues>, 'parse' | 'type'>
) {
	return <InputField {...props} type="date" />;
}
