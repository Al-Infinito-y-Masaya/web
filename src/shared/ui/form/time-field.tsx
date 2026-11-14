import type { FieldValues } from 'react-hook-form';

import { InputField, type InputFieldProps } from './input-field';

/** Native time picker. The value is an `HH:mm` string (empty string when cleared). */
export function TimeField<TValues extends FieldValues>(
	props: Omit<InputFieldProps<TValues>, 'parse' | 'type'>
) {
	return <InputField {...props} type="time" />;
}
