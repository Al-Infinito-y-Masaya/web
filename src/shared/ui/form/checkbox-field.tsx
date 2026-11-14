import { Controller, type FieldValues, type Path } from 'react-hook-form';

import { FieldError } from '@/shared/ui/primitives/field';
import { cn } from '@/shared/utils';

import type { FormControl } from './types';

/** Checkbox with a label and help text on the right, for yes/no options. */
export function CheckboxField<TValues extends FieldValues>({
	control,
	name,
	label,
	description,
	disabled,
	className
}: {
	control: FormControl<TValues>;
	name: Path<TValues>;
	label: string;
	description?: string;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<div className={cn('flex flex-col gap-1', className)}>
					<label
						className={cn(
							'flex cursor-pointer items-start gap-2.5',
							disabled && 'cursor-not-allowed opacity-60'
						)}
					>
						<input
							type="checkbox"
							name={field.name}
							ref={field.ref}
							checked={!!field.value}
							onChange={e => field.onChange(e.target.checked)}
							onBlur={field.onBlur}
							disabled={disabled}
							aria-invalid={fieldState.invalid}
							className="mt-0.5 size-4 shrink-0 accent-primary"
						/>
						<span className="flex flex-col">
							<span className="text-sm font-medium">{label}</span>
							{description && (
								<span className="text-xs text-muted-foreground">{description}</span>
							)}
						</span>
					</label>
					{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
				</div>
			)}
		/>
	);
}
