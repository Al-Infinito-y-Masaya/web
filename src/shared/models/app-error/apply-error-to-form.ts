import { type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';

import type { AppError } from './app-error';
import { describeAppError, type ErrorDescription } from './describe-error';

/** Path in `errors.root` read by `<FormErrorAlert>`. React Hook Form clears it on every submit. */
export const FORM_ALERT_PATH = 'root.server';

/**
 * Writes an AppError into a form:
 * - each entry of a validation error's `fieldErrors` goes to its field
 *   (a `body.` prefix, common in some backends, is stripped);
 * - a summary goes to `errors.root.server`, shown by `<FormErrorAlert>`.
 */
export function applyAppErrorToForm<TI extends FieldValues, TO extends FieldValues>(
	error: AppError,
	form: UseFormReturn<TI, unknown, TO>
) {
	if (error.kind === 'validation') {
		for (const [key, message] of Object.entries(error.fieldErrors)) {
			const field = key.replace(/^body\./, '');
			if (field === 'root' || field === 'non_field_errors') continue;
			form.setError(field as Path<TI>, {
				type: 'server',
				message: Array.isArray(message) ? message.join(' ') : message
			});
		}
	}

	const summary: ErrorDescription = describeAppError(error);
	form.setError(FORM_ALERT_PATH as `root.${string}`, {
		type: summary.tone,
		message: summary.title,
		types: { description: summary.description, action: summary.action }
	});
}
