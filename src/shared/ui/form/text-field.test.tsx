import { cleanup, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test } from 'vitest';
import { z } from 'zod';

import { TextField } from './text-field';

const TestSchema = z.object({
	user: z.string().max(20, 'Username must be 20 characters or fewer')
});

type TestForm = z.infer<typeof TestSchema>;

function TestFormComponent({ disabled }: { disabled?: boolean }) {
	const { control } = useForm<TestForm>({
		defaultValues: {
			user: 'Default'
		},
		resolver: zodResolver(TestSchema),
		mode: 'onChange'
	});

	return (
		<TextField
			control={control}
			name="user"
			label="Username"
			description="Type your username"
			placeholder="Enter your username"
			disabled={disabled}
		/>
	);
}

afterEach(() => {
	cleanup();
});

describe('TextField', () => {
	test('renders', () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('textbox', { name: 'Username' });
		expect(input).toBeInTheDocument();
		expect(screen.getByLabelText('Username')).toBeInTheDocument();
		expect(screen.getByText('Type your username')).toBeInTheDocument();
	});

	test('default-value', async () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('textbox', { name: 'Username' });
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue('Default');
		expect(screen.getByLabelText('Username')).toBeInTheDocument();
	});

	test('placeholder', async () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('textbox', { name: 'Username' });
		expect(input).toHaveAttribute('placeholder', 'Enter your username');
	});

	test('on-change', async () => {
		const user = userEvent.setup();
		render(<TestFormComponent />);
		const input = screen.getByRole('textbox', { name: 'Username' });

		await user.clear(input);
		await user.type(input, 'New Value');
		expect(input).toHaveValue('New Value');
	});

	test('disabled', async () => {
		const user = userEvent.setup();
		render(<TestFormComponent disabled />);
		const input = screen.getByRole('textbox', { name: 'Username' });

		expect(input).toBeDisabled();

		await user.type(input, 'New Value');
		expect(input).toHaveValue('Default');
	});

	test('validation-error', async () => {
		const user = userEvent.setup();
		render(<TestFormComponent />);
		const input = screen.getByRole('textbox', { name: 'Username' });

		await user.type(input, 'MiValorConMuchosMasDe20Caracteres');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(
			await screen.findByText('Username must be 20 characters or fewer')
		).toBeInTheDocument();

		await user.clear(input);
		expect(input).toHaveValue('');
		expect(input).toHaveAttribute('aria-invalid', 'false');
		expect(
			screen.queryByText('Username must be 20 characters or fewer')
		).not.toBeInTheDocument();
	});
});
