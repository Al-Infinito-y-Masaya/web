import { z } from 'zod';

/**
 * Global Zod configuration. Imported once from `main.tsx` (and the test
 * setup) so every schema shares the same error messages.
 *
 * To localize messages, spread a locale: `z.config(z.locales.es())`.
 */
z.config({
	customError: issue => {
		if (issue.code === 'invalid_type' && issue.input === undefined) {
			return 'This field is required';
		}
		return undefined; // fall back to Zod's default message
	}
});
