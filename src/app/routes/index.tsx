import { createFileRoute } from '@tanstack/react-router';

import { Inicio } from '@/features/inicio/inicio';

export const Route = createFileRoute('/')({ component: Inicio });
