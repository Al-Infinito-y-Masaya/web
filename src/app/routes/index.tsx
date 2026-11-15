import { createFileRoute } from '@tanstack/react-router';

import { IntroScreen } from '@/features/intro/intro-screen';

/** `/` es la portada pública: la intro animada de Mangroove. */
export const Route = createFileRoute('/')({
	component: IntroScreen
});
