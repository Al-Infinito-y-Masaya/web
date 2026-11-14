import { cn } from '@/shared/utils';

/** Loading placeholder that takes the place of content. */
export function Skeleton({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				'block animate-pulse rounded-md bg-muted motion-reduce:animate-none',
				className
			)}
		/>
	);
}
