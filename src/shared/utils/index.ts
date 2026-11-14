import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges class names, resolving Tailwind conflicts (`cn('p-2', cond && 'p-4')`). */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
