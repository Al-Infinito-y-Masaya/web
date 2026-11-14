import { makeCrudService } from '@/shared/data/crud-service/make-crud-service';

import { itemsApi } from './api';

/**
 * Query keys, options and hooks for items:
 * `itemService.hooks.useList(params)`, `itemService.options.detail(id)`…
 */
export const itemService = makeCrudService({ name: 'items', adapter: itemsApi });
