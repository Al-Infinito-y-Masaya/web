import { LogIn, Mail } from 'lucide-react';

import { FormErrorAlert, PasswordField, TextField, useZodForm } from '@/shared/ui/form';
import { Button } from '@/shared/ui/primitives/button';
import { Spinner } from '@/shared/ui/primitives/spinner';

import type { User } from './api';
import { loginSchema } from './schemas';
import { useLogin } from './session';

export function LoginForm({ onSuccess }: { onSuccess: (user: User) => void }) {
	const login = useLogin();
	const { control, submit, isSubmitting } = useZodForm({
		schema: loginSchema,
		defaultValues: { email: '', password: '' },
		onSubmit: values => login.mutateAsync(values),
		onSuccess
	});

	return (
		<form noValidate onSubmit={submit} className="flex flex-col gap-5">
			<FormErrorAlert control={control} />
			<TextField
				control={control}
				name="email"
				type="email"
				label="Email"
				autoComplete="email"
				placeholder="you@example.com"
				icon={<Mail />}
			/>
			<PasswordField control={control} name="password" label="Password" />
			<Button type="submit" size="lg" disabled={isSubmitting}>
				{isSubmitting ? <Spinner /> : <LogIn />}
				Sign in
			</Button>
		</form>
	);
}
