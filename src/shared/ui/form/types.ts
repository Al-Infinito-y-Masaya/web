import type { Control, FieldValues } from 'react-hook-form';

/**
 * A react-hook-form `Control` whose submitted (transformed) type may differ
 * from the field values, as happens with Zod `transform`s. Field components
 * take this so they accept `useZodForm`'s control.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormControl<TValues extends FieldValues> = Control<TValues, any, any>;
