import { RotateCw, TriangleAlert } from 'lucide-react';

import { describeError } from '@/shared/models/app-error/describe-error';
import { Button } from '@/shared/ui/primitives/button';

import { EmptyState } from './empty-state';

/** Full-block error with a retry button, for failed queries. */
export function ErrorState({
	error,
	title = 'Something went wrong',
	onRetry
}: {
	error: unknown;
	title?: string;
	onRetry?: () => void;
}) {
	return (
		<EmptyState
			icon={TriangleAlert}
			title={title}
			description={describeError(error)}
			actions={
				onRetry && (
					<Button variant="outline" onClick={onRetry}>
						<RotateCw />
						Try again
					</Button>
				)
			}
		/>
	);
}
