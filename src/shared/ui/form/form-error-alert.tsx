import { useQueryClient } from '@tanstack/react-query';
import { useFormState, type FieldValues } from 'react-hook-form';

import type { ErrorAction } from '@/shared/models/app-error/describe-error';
import { Alert, type AlertTone } from '@/shared/ui/feedback/alert';

import type { FormControl } from './types';

type ServerError = {
	type?: string;
	message?: string;
	types?: { description?: string; action?: ErrorAction };
};

/**
 * Shows the server error that `AppError.applyToForm` (and so `useZodForm`)
 * stored in `errors.root.server`, with a "Try again" (resubmits the form it is
 * in) or "Reload data" action when it makes sense. Place it inside the `<form>`.
 */
export function FormErrorAlert<TValues extends FieldValues>({
	control,
	className
}: {
	/** Optional inside a `FormProvider`. */
	control?: FormControl<TValues>;
	className?: string;
}) {
	const { errors } = useFormState({ control });
	const queryClient = useQueryClient();
	const error = (errors.root as Record<string, ServerError> | undefined)?.server;

	if (!error?.message) return null;

	const action = error.types?.action;
	return (
		<Alert
			tone={(error.type as AlertTone) ?? 'error'}
			title={error.message}
			className={className}
			action={
				action === 'retry' ? (
					<button
						type="submit"
						className="font-semibold underline-offset-4 hover:underline"
					>
						Try again
					</button>
				) : action === 'reload' ? (
					<button
						type="button"
						onClick={() => queryClient.invalidateQueries()}
						className="font-semibold underline-offset-4 hover:underline"
					>
						Reload data
					</button>
				) : undefined
			}
		>
			{error.types?.description}
		</Alert>
	);
}
