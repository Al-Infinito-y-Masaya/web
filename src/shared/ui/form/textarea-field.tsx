import type { ComponentProps } from 'react';
import { Controller, type FieldValues, type Path } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/primitives/field';
import { Textarea } from '@/shared/ui/primitives/textarea';

import type { FormControl } from './types';

type TextareaFieldProps<TValues extends FieldValues> = Omit<
	ComponentProps<typeof Textarea>,
	'name' | 'defaultValue'
> & {
	control: FormControl<TValues>;
	name: Path<TValues>;
	label: string;
	description?: string;
	fieldClassName?: string;
};

/** Multi-line text bound to react-hook-form. */
export function TextareaField<TValues extends FieldValues>({
	control,
	name,
	label,
	description,
	fieldClassName,
	id,
	...props
}: TextareaFieldProps<TValues>) {
	const inputId = id ?? name;
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field className={fieldClassName} data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
					<Textarea
						{...field}
						{...props}
						id={inputId}
						value={field.value ?? ''}
						aria-invalid={fieldState.invalid}
					/>
					{description && <FieldDescription>{description}</FieldDescription>}
					{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
				</Field>
			)}
		/>
	);
}
