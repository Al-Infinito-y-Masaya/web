import { cleanup, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test } from 'vitest';
import { z } from 'zod';

import { NumberField } from './number-field';

const TestSchema = z.object({
	quantity: z
		.number('Quantity must be a number')
		.nonnegative('Quantity cannot be negative')
		.max(25, 'Quantity cannot exceed 25')
		.multipleOf(0.1, 'Only steps of 0.1 are allowed')
});

function TestFormComponent({ disabled }: { disabled?: boolean }) {
	const { control } = useForm({
		resolver: zodResolver(TestSchema),
		mode: 'onChange'
	});
	return (
		<NumberField
			control={control}
			label="Quantity"
			name="quantity"
			description="Enter a quantity"
			disabled={disabled}
		/>
	);
}

afterEach(cleanup);

describe('NumberField', () => {
	test('renders correctly', () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('spinbutton', { name: 'Quantity' });

		expect(input).toBeInTheDocument();
		expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
		expect(screen.getByText('Enter a quantity')).toBeInTheDocument();
	});

	test('null input when invalid input is typed', async () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('spinbutton', { name: 'Quantity' });

		await userEvent.type(input, 'abc');
		expect(input).toHaveValue(null);
	});

	test('numbers between letters', async () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('spinbutton', { name: 'Quantity' });

		await userEvent.type(input, 'abc2t6');
		expect(input).toHaveValue(26);
	});

	test('negative numbers', async () => {
		render(<TestFormComponent />);
		const input = screen.getByRole('spinbutton', { name: 'Quantity' });

		await userEvent.type(input, '-10');
		expect(await screen.findByText('Quantity cannot be negative')).toBeInTheDocument();
	});

	test('disabled', async () => {
		render(<TestFormComponent disabled />);
		const input = screen.getByRole('spinbutton', { name: 'Quantity' });
		expect(input).toBeDisabled();

		await userEvent.type(input, '10');
		expect(input).toHaveValue(null);
	});

	test('shows error when value exceeds max', async () => {
		const user = userEvent.setup();

		render(<TestFormComponent />);

		const input = screen.getByRole('spinbutton', {
			name: 'Quantity'
		});

		await user.clear(input);
		await user.type(input, '100');

		expect(input).toHaveValue(100);

		expect(await screen.findByText('Quantity cannot exceed 25')).toBeInTheDocument();

		expect(input).toHaveAttribute('aria-invalid', 'true');
	});

	test('shows error when value is not a multiple of 0.1', async () => {
		const user = userEvent.setup();

		render(<TestFormComponent />);

		const input = screen.getByRole('spinbutton', {
			name: 'Quantity'
		});

		await user.clear(input);
		await user.type(input, '10.52');

		expect(input).toHaveValue(10.52);

		expect(await screen.findByText('Only steps of 0.1 are allowed')).toBeInTheDocument();

		expect(input).toHaveAttribute('aria-invalid', 'true');

		await user.clear(input);
		await user.type(input, '10.0');

		expect(input).toHaveValue(10.0);
		expect(input).toHaveAttribute('aria-invalid', 'false');
	});
});
