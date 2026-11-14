import { FileIcon, UploadCloud, X } from 'lucide-react';
import { useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import { Controller, type FieldValues, type Path } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/primitives/field';
import { Input } from '@/shared/ui/primitives/input';
import { cn } from '@/shared/utils';

import type { FormControl } from './types';

/** A single File, an array of Files, a FileList (what `<input type=file>` gives) or nothing. */
type FileValue = File | File[] | FileList | null | undefined;

type FileFieldProps<TValues extends FieldValues> = Omit<
	ComponentProps<typeof Input>,
	'type' | 'name' | 'defaultValue' | 'value' | 'onChange' | 'multiple'
> & {
	control: FormControl<TValues>;
	name: Path<TValues>;
	label: string;
	description?: string;
	fieldClassName?: string;
	icon?: ReactNode;
	/** Value becomes `File[]` instead of `File | null`. */
	multiple?: boolean;
	showFileName?: boolean;
	/** Thumbnails for selected images. */
	showPreview?: boolean;
	emptyMessage?: string;
	browseLabel?: string;
	onFilesChange?: (files: File | File[] | null) => void;
};

function normalizeFiles(value: FileValue): File[] {
	if (!value) return [];
	if (typeof File !== 'undefined' && value instanceof File) return [value];
	if (typeof FileList !== 'undefined' && value instanceof FileList) return Array.from(value);
	if (Array.isArray(value)) return value.filter((f): f is File => f instanceof File);
	return [];
}

function formatFileSize(size: number) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreviewList({ files }: { files: File[] }) {
	const previews = useMemo(
		() =>
			files
				.filter(file => file.type.startsWith('image/'))
				.map(file => ({ name: file.name, url: URL.createObjectURL(file) })),
		[files]
	);

	// Release the temporary object URLs.
	useEffect(() => () => previews.forEach(p => URL.revokeObjectURL(p.url)), [previews]);

	if (previews.length === 0) return null;

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{previews.map(preview => (
				<div key={preview.url} className="overflow-hidden rounded-md border bg-muted">
					<img
						src={preview.url}
						alt={preview.name}
						className="h-28 w-full object-cover"
					/>
				</div>
			))}
		</div>
	);
}

/** Drop zone + file picker bound to react-hook-form. */
export function FileField<TValues extends FieldValues>({
	control,
	name,
	label,
	description,
	fieldClassName,
	icon,
	id,
	multiple = false,
	showFileName = true,
	showPreview = false,
	emptyMessage = 'Choose or drop files here',
	browseLabel = 'Browse files',
	onFilesChange,
	className,
	disabled,
	accept,
	...inputProps
}: FileFieldProps<TValues>) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const inputId = id ?? name;

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				const files = normalizeFiles(field.value as FileValue);
				const hasFiles = files.length > 0;
				const invalid = fieldState.invalid;

				const updateFiles = (selected: File[]) => {
					const next = multiple ? selected : (selected[0] ?? null);
					field.onChange(next);
					onFilesChange?.(next);
				};

				const clearFiles = () => {
					const next = multiple ? [] : null;
					field.onChange(next);
					onFilesChange?.(next);
					if (inputRef.current) inputRef.current.value = '';
				};

				return (
					<Field className={fieldClassName} data-invalid={invalid}>
						<FieldLabel htmlFor={inputId}>{label}</FieldLabel>

						<label
							data-testid="file-dropzone"
							htmlFor={inputId}
							className={cn(
								'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-background p-4 transition-colors hover:bg-accent/50',
								'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none',
								invalid && 'border-destructive bg-destructive/5',
								disabled && 'pointer-events-none cursor-not-allowed opacity-50',
								className
							)}
							onDragOver={event => event.preventDefault()}
							onDrop={event => {
								event.preventDefault();
								if (!disabled) updateFiles(Array.from(event.dataTransfer.files));
							}}
						>
							<span
								className={cn(
									'flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground [&>svg]:size-4',
									invalid && 'border-destructive/40 text-destructive'
								)}
							>
								{icon ?? <UploadCloud />}
							</span>

							<div className="min-w-0 flex-1">
								<p
									className={cn(
										'text-sm font-medium',
										invalid && 'text-destructive'
									)}
								>
									{hasFiles
										? multiple
											? `${files.length} file(s) selected`
											: files[0]?.name
										: emptyMessage}
								</p>
								<p className="text-xs text-muted-foreground">
									{browseLabel}
									{accept ? ` • Accepted: ${accept}` : ''}
								</p>
							</div>

							<Input
								{...inputProps}
								ref={node => {
									inputRef.current = node;
									field.ref(node);
								}}
								id={inputId}
								name={field.name}
								type="file"
								accept={accept}
								multiple={multiple}
								disabled={disabled}
								aria-invalid={invalid}
								onBlur={field.onBlur}
								className="sr-only"
								onChange={event =>
									updateFiles(Array.from(event.target.files ?? []))
								}
							/>
						</label>

						{description && <FieldDescription>{description}</FieldDescription>}

						{showFileName && hasFiles && (
							<div
								className={cn(
									'space-y-2 rounded-md border bg-muted/30 p-3 text-sm',
									invalid && 'border-destructive/40 bg-destructive/5'
								)}
							>
								{files.map((file, index) => (
									<div
										key={`${file.name}-${file.lastModified}-${index}`}
										className="flex items-center justify-between gap-3"
									>
										<span className="flex min-w-0 items-center gap-2">
											<FileIcon className="size-4 shrink-0 text-muted-foreground" />
											<span className="truncate">{file.name}</span>
										</span>
										<span className="shrink-0 text-xs text-muted-foreground">
											{formatFileSize(file.size)}
										</span>
									</div>
								))}
								<button
									type="button"
									onClick={clearFiles}
									disabled={disabled}
									className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									<X className="size-4" />
									Clear
								</button>
							</div>
						)}

						{showPreview && hasFiles && <FilePreviewList files={files} />}

						{invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				);
			}}
		/>
	);
}
