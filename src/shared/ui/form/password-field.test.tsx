import { cleanup, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test } from 'vitest';
import z from 'zod';

import { PasswordField } from './password-field';

const TestSchema = z.object({
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(20, 'Password must be at most 20 characters')
});

function TestComponent({ disabled }: { disabled?: boolean }) {
	const { control } = useForm<z.infer<typeof TestSchema>>({
		resolver: zodResolver(TestSchema),
		defaultValues: { password: '' },
		mode: 'onChange'
	});

	return (
		<PasswordField
			control={control}
			name="password"
			placeholder="Enter your password"
			label="Password"
			description="Type your password"
			disabled={disabled}
		/>
	);
}

afterEach(cleanup);

describe('PasswordField', () => {
	test('renders', () => {
		render(<TestComponent />);
		const input = screen.getByLabelText('Password');

		expect(input).toHaveAttribute('type', 'password');
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByText('Type your password')).toBeInTheDocument();
	});

	test('placeholder', async () => {
		render(<TestComponent />);
		const input = screen.getByLabelText('Password');

		expect(input).toHaveAttribute('placeholder', 'Enter your password');

		expect(input).toHaveValue('');
	});

	test('disabled', async () => {
		const user = userEvent.setup();
		render(<TestComponent disabled />);
		const input = screen.getByLabelText('Password');

		expect(input).toHaveAttribute('disabled', '');
		await user.type(input, 'test');
		expect(input).toHaveValue('');

		const button = screen.getByRole('button', {
			name: 'Show password'
		});
		expect(button).toHaveAttribute('disabled', '');

		await user.click(button);

		expect(input).toHaveAttribute('type', 'password');
	});

	test('show-password', async () => {
		const user = userEvent.setup();
		render(<TestComponent />);
		const input = screen.getByLabelText('Password');

		expect(input).toHaveAttribute('type', 'password');

		const button = screen.getByRole('button', {
			name: 'Show password'
		});
		await user.click(button);

		expect(input).toHaveAttribute('type', 'text');
	});

	test('validation-error', async () => {
		const user = userEvent.setup();
		render(<TestComponent />);
		const input = screen.getByLabelText('Password');

		await user.type(input, 'a');
		const error = screen.getByText('Password must be at least 8 characters');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(error).toBeInTheDocument();

		await user.type(input, 'bcdefgh');
		expect(error).not.toBeInTheDocument();
		expect(input).toHaveAttribute('aria-invalid', 'false');

		await user.type(input, 'bcdefghijklmnopqrstuvwxyz');
		const error2 = screen.getByText('Password must be at most 20 characters');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(error2).toBeInTheDocument();
	});
});
