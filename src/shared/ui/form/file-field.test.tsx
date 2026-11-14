import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

import { zodResolver } from '@hookform/resolvers/zod';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@/shared/ui/primitives/button';

import { FileField } from './file-field';

const TestSchema = z.object({
	file: z.instanceof(File, { message: 'File is required' })
});

type TestSchemaType = z.infer<typeof TestSchema>;

function TestComponent({
	submitHandler,
	onFilesChange,
	disabled
}: {
	submitHandler?: (data: TestSchemaType) => void;
	onFilesChange?: (files: File | File[] | null) => void;
	disabled?: boolean;
}) {
	const { control, handleSubmit } = useForm<TestSchemaType>({
		resolver: zodResolver(TestSchema),
		mode: 'onChange'
	});
	return (
		<form onSubmit={handleSubmit(submitHandler ?? (() => {}))}>
			<FileField
				control={control}
				label="Archivo"
				name="file"
				disabled={disabled}
				description="Choose a file"
				onFilesChange={onFilesChange}
			/>
			<Button type="submit">Submit</Button>
		</form>
	);
}

const MultipleSchema = z.object({
	file: z.array(z.instanceof(File))
});

type MultipleSchemaType = z.infer<typeof MultipleSchema>;

function MultipleTestComponent() {
	const { control } = useForm<MultipleSchemaType>({
		resolver: zodResolver(MultipleSchema),
		defaultValues: {
			file: []
		}
	});

	return <FileField control={control} name="file" label="Archivos" multiple />;
}

afterEach(cleanup);

describe('FileField', () => {
	test('renders', () => {
		render(<TestComponent />);
		expect(screen.getByText('Archivo')).toBeInTheDocument();
		expect(screen.getByLabelText('Archivo')).toBeInTheDocument();
		expect(screen.getByText('Choose a file')).toBeInTheDocument();
	});

	test('disabled', () => {
		render(<TestComponent disabled />);
		expect(screen.getByLabelText('Archivo')).toBeDisabled();
	});

	test('submit', async () => {
		const user = userEvent.setup();
		const submitHandler = vi.fn();
		render(<TestComponent submitHandler={submitHandler} />);
		const file = new File(['test'], 'test.txt');
		const fileInput = screen.getByLabelText('Archivo');
		await user.upload(fileInput, file);
		const submit = screen.getByRole('button', { name: 'Submit' });
		await user.click(submit);
		expect(submitHandler).toHaveBeenCalledWith({ file }, expect.any(Object));
	});

	test('validation-error', async () => {
		const user = userEvent.setup();
		const submitHandler = vi.fn();
		render(<TestComponent submitHandler={submitHandler} />);
		const fileInput = screen.getByLabelText('Archivo');
		const submit = screen.getByRole('button', { name: 'Submit' });

		await user.click(submit);

		expect(fileInput).toHaveAttribute('aria-invalid', 'true');
		expect(screen.getByText('File is required')).toBeInTheDocument();
	});

	test('shows selected file', async () => {
		const user = userEvent.setup();

		render(<TestComponent />);

		const input = screen.getByLabelText('Archivo');
		const file = new File(['hello'], 'documento.txt', {
			type: 'text/plain'
		});

		await user.upload(input, file);

		expect(screen.getAllByText('documento.txt')).toHaveLength(2);
	});

	test('clears selected file', async () => {
		const user = userEvent.setup();

		render(<TestComponent />);

		const input = screen.getByLabelText('Archivo');
		const file = new File(['hello'], 'documento.txt', {
			type: 'text/plain'
		});

		await user.upload(input, file);

		expect(screen.getAllByText('documento.txt')).toHaveLength(2);

		await user.click(screen.getByRole('button', { name: 'Clear' }));

		expect(screen.queryByText('documento.txt')).not.toBeInTheDocument();
		expect(input).toHaveValue('');

		expect(screen.getByText('Choose or drop files here')).toBeInTheDocument();
	});

	test('calls onFilesChange', async () => {
		const user = userEvent.setup();
		const onFilesChange = vi.fn();

		render(<TestComponent onFilesChange={onFilesChange} />);

		const input = screen.getByLabelText('Archivo');
		const file = new File(['hello'], 'documento.txt');

		await user.upload(input, file);

		expect(onFilesChange).toHaveBeenCalledWith(file);

		await user.click(screen.getByRole('button', { name: 'Clear' }));

		expect(onFilesChange).toHaveBeenLastCalledWith(null);
	});

	test('supports multiple files', async () => {
		const user = userEvent.setup();

		render(<MultipleTestComponent />);

		const input = screen.getByLabelText('Archivos');

		const file1 = new File(['one'], 'one.txt');
		const file2 = new File(['two'], 'two.txt');

		await user.upload(input, [file1, file2]);

		expect(screen.getByText('2 file(s) selected')).toBeInTheDocument();

		expect(screen.getByText('one.txt')).toBeInTheDocument();
		expect(screen.getByText('two.txt')).toBeInTheDocument();

		expect(input).toHaveAttribute('multiple');
	});

	test('accepts files by drag and drop', () => {
		render(<TestComponent />);

		const file = new File(['hello'], 'documento.txt');

		fireEvent.drop(screen.getByTestId('file-dropzone'), {
			dataTransfer: {
				files: [file]
			}
		});

		expect(screen.getAllByText('documento.txt')).toHaveLength(2);
	});
});
