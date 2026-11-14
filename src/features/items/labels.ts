import type { StatusTone } from '@/shared/ui/data/status-badge';

import type { ItemStatus } from './types';

/** Display text for each status. `Record<ItemStatus, …>` fails to compile if the API adds one. */
export const itemStatusLabels: Record<ItemStatus, string> = {
	draft: 'Draft',
	active: 'Active',
	archived: 'Archived'
};

export const itemStatusTones: Record<ItemStatus, StatusTone> = {
	draft: 'neutral',
	active: 'success',
	archived: 'outline'
};

export const itemStatusOptions = Object.entries(itemStatusLabels).map(([value, label]) => ({
	value,
	label
}));
