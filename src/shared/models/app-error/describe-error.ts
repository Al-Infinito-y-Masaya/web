import { AppException, isAppError, type AppError } from './app-error';

/** What to offer next to an error message. */
export type ErrorAction = 'retry' | 'reload';

export type ErrorDescription = {
	title: string;
	description?: string;
	tone: 'error' | 'warning';
	action?: ErrorAction;
};

/**
 * User-facing summary of an AppError. Network and server errors are not the
 * user's fault, so the copy says nothing was lost and offers to retry. Edit the
 * copy here to change it everywhere.
 */
export function describeAppError(error: AppError): ErrorDescription {
	const status = 'status' in error ? error.status : undefined;

	if (error.kind === 'network' || (status != null && status >= 500)) {
		return {
			tone: 'error',
			title: 'Your changes could not be saved',
			description: 'Check your connection and try again. Nothing you typed was lost.',
			action: 'retry'
		};
	}
	if (status === 409) {
		return {
			tone: 'warning',
			title: 'This record changed while you were editing it',
			description:
				'Review the current version before saving again. Nothing you typed was lost.',
			action: 'reload'
		};
	}
	if (status === 429) {
		return {
			tone: 'warning',
			title: 'Too many requests',
			description: 'Wait a few seconds and try again.',
			action: 'retry'
		};
	}
	if (error.kind === 'validation') {
		const root = error.fieldErrors.root ?? error.fieldErrors.non_field_errors;
		return {
			tone: 'error',
			title: error.message || 'Please review the highlighted fields',
			description: root ? [root].flat().join(' ') : undefined
		};
	}
	return { tone: 'error', title: error.message || 'The operation could not be completed' };
}

/**
 * Human-readable text for anything a query or mutation can throw. A validation
 * error carries its real detail in `fieldErrors`, so those are preferred.
 */
export function describeError(
	e: unknown,
	fallback = 'The operation could not be completed.'
): string {
	const error = e instanceof AppException ? e.error : isAppError(e) ? e : undefined;
	if (error?.kind === 'validation') {
		const messages = Object.values(error.fieldErrors).flat();
		if (messages.length) return messages.join(' ');
	}
	return error?.message || (e instanceof Error && e.message) || fallback;
}
