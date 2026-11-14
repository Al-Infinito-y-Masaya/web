import type { ReactNode } from 'react';
import { Controller, type FieldValues, type Path } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/primitives/field';

import { Slider } from '../primitives/slider';
import type { FormControl } from './types';

type SliderFieldProps<TValues extends FieldValues> = Omit<
	React.ComponentProps<typeof Slider>,
	'name' | 'defaultValue'
> & {
	control: FormControl<TValues>;
	name: Path<TValues>;
	label: string;
	description?: string;
	fieldClassName?: string;
	icon?: ReactNode;
};

/** Numeric value picked with a slider. */
export function SliderField<TValues extends FieldValues>({
	control,
	name,
	label,
	description,
	fieldClassName,
	icon,
	id,
	...inputProps
}: SliderFieldProps<TValues>) {
	const inputId = id ?? name;

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Field className={fieldClassName} data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
					<div className="relative">
						{icon && (
							<span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
								{icon}
							</span>
						)}
						<Slider
							{...field}
							{...inputProps}
							id={inputId}
							name={field.name}
							value={[field.value ?? 0]}
							onValueChange={value => {
								field.onChange(value[0]);
							}}
							onBlur={field.onBlur}
							aria-invalid={fieldState.invalid}
						/>
					</div>
					{description && <FieldDescription>{description}</FieldDescription>}
					{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
				</Field>
			)}
		/>
	);
}
