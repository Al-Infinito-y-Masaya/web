import { Skeleton } from '@/shared/ui/primitives/skeleton';

/** Loading placeholder shaped like a typical page: stat cards and a table. */
export function PageSkeleton({
	stats = 4,
	columns = 5,
	rows = 7
}: {
	stats?: number;
	columns?: number;
	rows?: number;
}) {
	return (
		<div className="flex flex-col gap-5" role="status" aria-label="Loading">
			<Skeleton className="h-9 w-64" />
			{stats > 0 && (
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					{Array.from({ length: stats }, (_, i) => (
						<Skeleton key={i} className="h-[74px] rounded-lg" />
					))}
				</div>
			)}
			<div className="overflow-hidden rounded-xl border bg-card">
				<div className="flex gap-6 border-b bg-muted/60 px-4 py-3">
					{Array.from({ length: columns }, (_, i) => (
						<Skeleton key={i} className="h-3 flex-1 bg-muted-foreground/15" />
					))}
				</div>
				{Array.from({ length: rows }, (_, r) => (
					<div
						key={r}
						className="flex items-center gap-6 border-b px-4 py-4 last:border-b-0"
					>
						{Array.from({ length: columns }, (_, c) => (
							<Skeleton
								key={c}
								className={c === 0 ? 'h-3.5 flex-[2]' : 'h-3.5 flex-1'}
							/>
						))}
					</div>
				))}
			</div>
			<span className="sr-only">Loading…</span>
		</div>
	);
}
