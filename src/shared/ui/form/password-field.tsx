import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';

import { InputField, type InputFieldProps } from './input-field';

/** Password input with a show/hide toggle. */
export function PasswordField<TValues extends FieldValues>(
	props: Omit<InputFieldProps<TValues>, 'parse' | 'type' | 'trailing'>
) {
	const [visible, setVisible] = useState(false);

	return (
		<InputField
			autoComplete="current-password"
			{...props}
			type={visible ? 'text' : 'password'}
			trailing={
				<button
					type="button"
					onClick={() => setVisible(v => !v)}
					disabled={props.disabled}
					aria-label={visible ? 'Hide password' : 'Show password'}
					className="flex items-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				>
					{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			}
		/>
	);
}
