import { zodResolver } from '@hookform/resolvers/zod';
import { ResultAsync } from 'neverthrow';
import { useEffect } from 'react';
import {
	useForm,
	type DefaultValues,
	type FieldValues,
	type Resolver,
	type UseFormProps
} from 'react-hook-form';
import type { z } from 'zod';

import { AppError, toAppError } from '@/shared/models/app-error/app-error';

type SubmitFn<TOut, R> = (values: TOut) => Promise<R> | ResultAsync<R, AppError>;

/**
 * react-hook-form + Zod + server error handling in one hook.
 *
 * - validates with `schema` (form state is `z.input`, submitted values are `z.output`);
 * - calls `onSubmit` with the parsed values; it may return a Promise (e.g.
 *   `mutation.mutateAsync`) or a `ResultAsync`;
 * - on failure, maps the `AppError` onto the fields and `<FormErrorAlert>`;
 * - on success, resets the form to the submitted values (so `isDirty` becomes
 *   false) and calls `onSuccess`;
 * - `values` re-initializes the form when remote data arrives (edit forms).
 *
 * ```tsx
 * const { form, submit } = useZodForm({
 *   schema: itemFormSchema,
 *   defaultValues: { name: '' },
 *   onSubmit: values => create.mutateAsync(values),
 *   onSuccess: item => navigate({ to: '/items/$itemId', params: { itemId: item.id } })
 * });
 * <form onSubmit={submit}>…</form>
 * ```
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>, R = unknown>({
	schema,
	defaultValues,
	values,
	onSubmit,
	onSuccess,
	resetOnSuccess = true,
	mode = 'onTouched'
}: {
	schema: TSchema;
	defaultValues?: DefaultValues<z.input<TSchema>>;
	/** Remote values (e.g. the record being edited); the form resets when they change. */
	values?: z.input<TSchema>;
	onSubmit: SubmitFn<z.output<TSchema>, R>;
	onSuccess?: (result: R, values: z.output<TSchema>) => void;
	resetOnSuccess?: boolean;
	mode?: UseFormProps['mode'];
}) {
	const form = useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
		// The cast bridges zod's and react-hook-form's generics; the public signature stays precise.
		resolver: zodResolver(schema) as unknown as Resolver<
			z.input<TSchema>,
			unknown,
			z.output<TSchema>
		>,
		defaultValues,
		mode
	});

	useEffect(() => {
		if (values) form.reset(values);
	}, [values, form]);

	const submit = form.handleSubmit(async parsed => {
		const pending = onSubmit(parsed);
		const result =
			pending instanceof ResultAsync
				? await pending
				: await ResultAsync.fromPromise(pending, toAppError);

		result.match(
			ok => {
				if (resetOnSuccess) form.reset(form.getValues());
				onSuccess?.(ok, parsed);
			},
			error => AppError.applyToForm(error, form)
		);
	});

	return {
		form,
		control: form.control,
		submit,
		isSubmitting: form.formState.isSubmitting,
		isDirty: form.formState.isDirty
	};
}
