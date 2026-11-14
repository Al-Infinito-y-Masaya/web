import type { FieldValues } from 'react-hook-form';

import { InputField, type InputFieldProps } from './input-field';

/** Text-like input (`text`, `email`, `url`, `tel`, `search`) bound to react-hook-form. */
export function TextField<TValues extends FieldValues>({
	type = 'text',
	...props
}: Omit<InputFieldProps<TValues>, 'parse'>) {
	return <InputField {...props} type={type} />;
}
