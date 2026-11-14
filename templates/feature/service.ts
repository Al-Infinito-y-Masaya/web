import { makeCrudService } from '@/shared/data/crud-service/make-crud-service';

import { __entity__Api } from './api';

export const __entity__Service = makeCrudService({ name: '__route__', adapter: __entity__Api });
