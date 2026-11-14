import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@/shared/ui/primitives/button';

import { DateField } from './date-field';

const TestSchema = z.object({
	date: z.string().min(1, 'Date is required')
});

type TestSchemaType = z.infer<typeof TestSchema>;

function TestComponent({
	submitHandler,
	disabled,
	onValueChange,
	min,
	max
}: {
	submitHandler?: (data: TestSchemaType) => void;
	disabled?: boolean;
	onValueChange?: (value: unknown) => void;
	min?: string;
	max?: string;
}) {
	const { control, handleSubmit } = useForm<TestSchemaType>({
		resolver: zodResolver(TestSchema),
		defaultValues: {
			date: ''
		},
		mode: 'onChange'
	});

	return (
		<form onSubmit={handleSubmit(submitHandler ?? (() => {}))}>
			<DateField
				control={control}
				name="date"
				label="Date"
				disabled={disabled}
				onValueChange={onValueChange}
				min={min}
				max={max}
				description="Pick your birth date"
			/>

			<Button type="submit">Submit</Button>
		</form>
	);
}

afterEach(cleanup);

describe('DateField', () => {
	test('renders', () => {
		render(<TestComponent />);

		expect(screen.getByLabelText('Date')).toBeInTheDocument();
		expect(screen.getByText('Pick your birth date')).toBeInTheDocument();
	});

	test('renders as date input', () => {
		render(<TestComponent />);

		expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date');
	});

	test('disabled', () => {
		render(<TestComponent disabled />);

		expect(screen.getByLabelText('Date')).toBeDisabled();
	});

	test('changes date', () => {
		render(<TestComponent />);

		const input = screen.getByLabelText('Date');

		fireEvent.change(input, {
			target: { value: '2026-08-15' }
		});

		expect(input).toHaveValue('2026-08-15');
	});

	test('submit', async () => {
		const user = userEvent.setup();
		const submitHandler = vi.fn();

		render(<TestComponent submitHandler={submitHandler} />);

		const input = screen.getByLabelText('Date');

		fireEvent.change(input, {
			target: { value: '2026-08-15' }
		});

		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(submitHandler).toHaveBeenCalledWith(
			{
				date: '2026-08-15'
			},
			expect.any(Object)
		);
	});

	test('calls onValueChange', () => {
		const onValueChange = vi.fn();

		render(<TestComponent onValueChange={onValueChange} />);

		const input = screen.getByLabelText('Date');

		fireEvent.change(input, {
			target: { value: '2026-08-15' }
		});

		expect(onValueChange).toHaveBeenCalledWith('2026-08-15');
	});

	test('validation-error', async () => {
		const user = userEvent.setup();
		const submitHandler = vi.fn();

		render(<TestComponent submitHandler={submitHandler} />);

		const input = screen.getByLabelText('Date');

		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(submitHandler).not.toHaveBeenCalled();

		expect(input).toHaveAttribute('aria-invalid', 'true');

		expect(screen.getByText('Date is required')).toBeInTheDocument();
	});

	test('supports min and max dates', () => {
		render(<TestComponent min="2026-01-01" max="2026-12-31" />);

		const input = screen.getByLabelText('Date');

		expect(input).toHaveAttribute('min', '2026-01-01');
		expect(input).toHaveAttribute('max', '2026-12-31');
	});
});
