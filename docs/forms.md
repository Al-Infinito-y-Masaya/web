# Forms

Forms use React Hook Form + Zod, wrapped by `useZodForm` (`src/shared/ui/form/hooks/use-zod-form.ts`).

## The pattern

```tsx
const itemFormSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	quantity: z.number().int().min(0)
});

function NewItemForm() {
	const create = itemService.hooks.useCreate();
	const navigate = useNavigate();

	const { control, submit, isSubmitting, isDirty } = useZodForm({
		schema: itemFormSchema,
		defaultValues: { name: '', quantity: 0 },
		onSubmit: values => create.mutateAsync(values), // Promise or ResultAsync
		onSuccess: item => navigate({ to: '/items/$itemId', params: { itemId: item.id } })
	});

	return (
		<form noValidate onSubmit={submit}>
			<FormErrorAlert control={control} />
			<TextField control={control} name="name" label="Name" />
			<NumberField control={control} name="quantity" label="Quantity" />
			<Button type="submit" disabled={isSubmitting}>
				Save
			</Button>
			<UnsavedChangesGuard dirty={isDirty} saving={isSubmitting} />
		</form>
	);
}
```

What `useZodForm` does for you:

1. Validates with the schema. The form state is `z.input<schema>` and `onSubmit` receives `z.output<schema>`, so transforms (`'' → null`, trimming…) happen for free.
2. Awaits `onSubmit`. If it fails, the `AppError` is applied to the form:
    - validation errors (`field_errors` from the API) land on the matching fields;
    - a summary goes to `<FormErrorAlert>`, with **Try again** for network/5xx errors and **Reload data** for 409 conflicts.
3. On success, resets the form to the submitted values (so `isDirty` is false) and calls `onSuccess`.
4. `values` re-initializes the form when remote data arrives — use it for edit forms (memoize it).

## Field components

All in `@/shared/ui/form`, all take `control`, `name`, `label`, optional `description`:

| Component       | Value type                | Notes                             |
| --------------- | ------------------------- | --------------------------------- |
| `TextField`     | `string`                  | `type="email"                     | "url" | …`, `icon` |
| `PasswordField` | `string`                  | Show/hide toggle                  |
| `NumberField`   | `number \| undefined`     | Empty input → `undefined`         |
| `DateField`     | `string` (`YYYY-MM-DD`)   | Native picker                     |
| `TimeField`     | `string` (`HH:mm`)        | Native picker                     |
| `TextareaField` | `string`                  |                                   |
| `SelectField`   | `string`                  | `options: { value, label }[]`     |
| `CheckboxField` | `boolean`                 |                                   |
| `SliderField`   | `number`                  |                                   |
| `FileField`     | `File \| null` / `File[]` | Drag & drop, previews, `multiple` |

Need a new input type? Wrap `InputField` (`parse` converts the raw string) or copy `CheckboxField` for non-input controls. Each field renders label, description and error message via the shadcn `Field` primitives.

## Layouts

- **Full page** — `src/app/routes/_app/items/new.tsx`.
- **Side panel** — `FormSheet` (`src/features/items/item-form-sheet.tsx`): header, scrollable body, Cancel/Save footer, confirms before closing with unsaved changes.
- **Confirmation dialog with fields** — `ActionDialog` wraps its body in a `<form>`.

## Server-side validation

The API should answer 400/422 with:

```json
{
	"detail": "Some fields are invalid",
	"field_errors": { "name": ["Already taken"], "root": "General problem" }
}
```

`name` goes to the `name` field; `root`/`non_field_errors` go to the alert description. Nested paths (`address.city`) work too. Adapt the parsing in `fromResponse` if your API differs.

## Unsaved changes

- `UnsavedChangesGuard` — blocks in-app navigation and tab closing while `dirty`.
- `FormSheet dirty={isDirty}` — confirms before closing the panel.
- `useBeforeUnload(dirty)` — tab close only.

## Validation messages

Global defaults are set in `src/config/zod.ts` ("This field is required"). To localize every Zod message, use a locale there: `z.config(z.locales.es())`.
