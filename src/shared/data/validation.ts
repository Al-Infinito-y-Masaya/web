import type { z } from 'zod';

import { AppErrors } from '@/shared/models/app-error/app-error';

/**
 * Parses `value` with a Zod schema, throwing a `validation` AppError whose
 * `fieldErrors` mirror the schema paths. Handy to validate API responses at
 * runtime or to check input before sending it.
 */
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
	const result = schema.safeParse(value);
	if (result.success) return result.data;
	const fields: Record<string, string[]> = {};
	for (const issue of result.error.issues) {
		(fields[issue.path.join('.') || 'root'] ??= []).push(issue.message);
	}
	throw AppErrors.validation(fields);
}
