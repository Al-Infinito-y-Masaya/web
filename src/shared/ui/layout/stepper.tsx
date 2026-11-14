import { Check } from 'lucide-react';
import { Fragment } from 'react';

import { cn } from '@/shared/utils';

export type Step = { title: string; description?: string };

/** Wizard steps: number in a circle, title, description and a line between steps. */
export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
	return (
		<ol
			aria-label="Steps"
			className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
		>
			{steps.map((step, i) => {
				const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
				return (
					<Fragment key={step.title}>
						{i > 0 && (
							<li aria-hidden className="hidden h-px flex-1 bg-border sm:block" />
						)}
						<li
							aria-current={state === 'current' ? 'step' : undefined}
							className="flex min-w-0 items-center gap-2.5"
						>
							<span
								className={cn(
									'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
									state === 'current' && 'border-2 border-primary text-primary',
									state === 'done' &&
										'border-primary bg-primary text-primary-foreground',
									state === 'upcoming' && 'text-muted-foreground'
								)}
							>
								{state === 'done' ? (
									<Check aria-hidden className="size-3.5" />
								) : (
									i + 1
								)}
								<span className="sr-only">
									{state === 'done' ? ' (completed)' : ''}
								</span>
							</span>
							<span className="flex min-w-0 flex-col">
								<span
									className={cn(
										'text-[13px] leading-[18px] font-bold',
										state === 'upcoming' && 'text-muted-foreground'
									)}
								>
									{step.title}
								</span>
								{step.description && (
									<span className="truncate text-xs text-muted-foreground">
										{step.description}
									</span>
								)}
							</span>
						</li>
					</Fragment>
				);
			})}
		</ol>
	);
}
