import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@/shared/ui/primitives/button';

import { TimeField } from './time-field';

const TestSchema = z.object({
	time: z.string().min(1, 'Time is required')
});

type TestSchemaType = z.infer<typeof TestSchema>;

function TestComponent({
	submitHandler,
	disabled,
	onValueChange,
	min,
	max,
	step
}: {
	submitHandler?: (data: TestSchemaType) => void;
	disabled?: boolean;
	onValueChange?: (value: unknown) => void;
	min?: string;
	max?: string;
	step?: number;
}) {
	const { control, handleSubmit } = useForm<TestSchemaType>({
		resolver: zodResolver(TestSchema),
		defaultValues: {
			time: ''
		},
		mode: 'onChange'
	});

	return (
		<form onSubmit={handleSubmit(submitHandler ?? (() => {}))}>
			<TimeField
				control={control}
				name="time"
				label="Time"
				disabled={disabled}
				onValueChange={onValueChange}
				min={min}
				max={max}
				step={step}
				description="Enter the time"
			/>

			<Button type="submit">Submit</Button>
		</form>
	);
}

afterEach(cleanup);

describe('TimeField', () => {
	test('renders', () => {
		render(<TestComponent />);

		const input = screen.getByLabelText('Time');

		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('type', 'time');
		expect(screen.getByLabelText('Time')).toBeInTheDocument();
		expect(screen.getByText('Enter the time')).toBeInTheDocument();
	});

	test('disabled', () => {
		render(<TestComponent disabled />);

		expect(screen.getByLabelText('Time')).toBeDisabled();
	});

	test('changes time', () => {
		render(<TestComponent />);

		const input = screen.getByLabelText('Time');

		fireEvent.change(input, {
			target: { value: '08:30' }
		});

		expect(input).toHaveValue('08:30');
	});

	test('submit', async () => {
		const user = userEvent.setup();
		const submitHandler = vi.fn();

		render(<TestComponent submitHandler={submitHandler} />);

		const input = screen.getByLabelText('Time');

		fireEvent.change(input, {
			target: { value: '08:30' }
		});

		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(submitHandler).toHaveBeenCalledWith(
			{
				time: '08:30'
			},
			expect.any(Object)
		);
	});

	test('calls onValueChange', () => {
		const onValueChange = vi.fn();

		render(<TestComponent onValueChange={onValueChange} />);

		const input = screen.getByLabelText('Time');

		fireEvent.change(input, {
			target: { value: '14:45' }
		});

		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith('14:45');
	});

	test('validation-error', async () => {
		const user = userEvent.setup();
		const submitHandler = vi.fn();

		render(<TestComponent submitHandler={submitHandler} />);

		const input = screen.getByLabelText('Time');

		await user.click(screen.getByRole('button', { name: 'Submit' }));

		expect(submitHandler).not.toHaveBeenCalled();

		expect(input).toHaveAttribute('aria-invalid', 'true');

		expect(screen.getByText('Time is required')).toBeInTheDocument();
	});

	test('supports min, max and step', () => {
		render(<TestComponent min="08:00" max="17:00" step={900} />);

		const input = screen.getByLabelText('Time');

		expect(input).toHaveAttribute('min', '08:00');
		expect(input).toHaveAttribute('max', '17:00');
		expect(input).toHaveAttribute('step', '900');
	});
});
