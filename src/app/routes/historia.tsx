import { createFileRoute } from '@tanstack/react-router';

import { Relato } from '@/features/relato/relato';

export const Route = createFileRoute('/historia')({ component: Relato });
