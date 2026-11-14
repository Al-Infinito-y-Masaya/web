import type { ReactNode } from 'react';
import { Controller, type FieldValues, type Path } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/primitives/field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/ui/primitives/select';

import type { FormControl } from './types';

export type SelectOption = {
	label: string;
	value: string;
	disabled?: boolean;
	icon?: ReactNode;
};

type SelectFieldProps<TValues extends FieldValues> = {
	control: FormControl<TValues>;
	name: Path<TValues>;
	id?: string;
	label: string;
	options: SelectOption[];
	placeholder?: string;
	description?: string;
	disabled?: boolean;
	fieldClassName?: string;
	triggerClassName?: string;
};

/** Single choice from a fixed list of options (Radix Select). */
export function SelectField<TValues extends FieldValues>({
	control,
	name,
	label,
	options,
	placeholder = 'Select an option',
	description,
	disabled,
	fieldClassName,
	triggerClassName,
	id
}: SelectFieldProps<TValues>) {
	const inputId = id ?? name;

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				return (
					<Field className={fieldClassName} data-invalid={fieldState.invalid}>
						<FieldLabel htmlFor={inputId}>{label}</FieldLabel>
						<Select
							value={field.value ?? ''}
							onValueChange={value => {
								if (value === '') return;
								field.onChange(value);
							}}
							defaultValue={field.value || undefined}
							disabled={disabled}
							name={name}
						>
							<SelectTrigger
								className={triggerClassName}
								aria-invalid={fieldState.invalid}
								id={inputId}
							>
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
							<SelectContent>
								{options.map(option => (
									<SelectItem
										key={option.value}
										value={option.value}
										disabled={option.disabled}
									>
										{option.icon && (
											<span className="mr-2 inline-block h-4 w-4">
												{option.icon}
											</span>
										)}
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{description && <FieldDescription>{description}</FieldDescription>}
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				);
			}}
		/>
	);
}
