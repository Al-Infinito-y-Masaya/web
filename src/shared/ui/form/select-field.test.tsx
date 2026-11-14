import { zodResolver } from '@hookform/resolvers/zod';
import { cleanup, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test, vi } from 'vitest';
import z from 'zod';

import { SelectField } from './select-field';

import '@testing-library/jest-dom/vitest';

import userEvent from '@testing-library/user-event';

const TestSchema = z.object({
	country: z.enum(['USA', 'Canada', 'Mexico'], 'Please select a country')
});

type TestSchemaType = z.infer<typeof TestSchema>;

function TestComponent({
	submitHandler,
	disabled
}: {
	submitHandler?: (data: TestSchemaType) => void;
	disabled?: boolean;
}) {
	const { control, handleSubmit } = useForm<TestSchemaType>({
		resolver: zodResolver(TestSchema),
		mode: 'onChange'
	});

	return (
		<form onSubmit={handleSubmit(submitHandler ?? (() => {}))}>
			<SelectField
				control={control}
				name="country"
				placeholder="Select a country"
				options={['USA', 'Canada', 'Mexico'].map(country => ({
					value: country,
					label: country
				}))}
				label="Country"
				description="Pick a country"
				disabled={disabled}
			/>
			<button type="submit">Submit</button>
		</form>
	);
}

afterEach(cleanup);

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
	value: vi.fn(() => false)
});

Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
	value: vi.fn()
});

Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
	value: vi.fn()
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
	value: vi.fn()
});

describe('SelectField', () => {
	test('renders', () => {
		render(<TestComponent />);
		const select = screen.getByRole('combobox', { name: 'Country' });
		expect(select).toBeInTheDocument();

		const label = screen.getByText('Country');
		expect(label).toBeInTheDocument();

		const placeholder = screen.getByText('Select a country');
		expect(placeholder).toBeInTheDocument();

		expect(screen.getByText('Pick a country')).toBeInTheDocument();
	});

	test('disables', () => {
		render(<TestComponent disabled />);

		const select = screen.getByRole('combobox', { name: 'Country' });
		expect(select).toBeDisabled();
	});

	test('selection', async () => {
		const user = userEvent.setup();
		const handleSubmitSpy = vi.fn();

		render(<TestComponent submitHandler={handleSubmitSpy} />);
		const select = screen.getByRole('combobox', { name: 'Country' });

		await user.click(select);
		const option = screen.getByRole('option', { name: 'Canada' });

		await user.click(option);

		expect(select).toHaveTextContent('Canada');

		const submit = screen.getByRole('button', { name: 'Submit' });
		await user.click(submit);

		expect(handleSubmitSpy).toHaveBeenCalledWith(
			expect.objectContaining({ country: 'Canada' }),
			expect.any(Object)
		);
	});

	test('validation-error', async () => {
		const user = userEvent.setup();
		render(<TestComponent />);

		const submit = screen.getByRole('button', { name: 'Submit' });
		await user.click(submit);

		const error = screen.getByText('Please select a country');
		expect(error).toBeInTheDocument();
	});
});
