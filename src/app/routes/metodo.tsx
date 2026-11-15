import { createFileRoute } from '@tanstack/react-router';

import { Metodo } from '@/features/metodo/metodo';

export const Route = createFileRoute('/metodo')({ component: Metodo });
