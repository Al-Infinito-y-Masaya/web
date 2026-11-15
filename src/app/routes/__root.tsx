import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { BarraSuperior } from '@/app/components/barra-superior';
import { env } from '@/config/env';
import { SesionProvider } from '@/features/datos/sesion';
import { IdiomaProvider, useIdioma } from '@/features/idioma/idioma';
import { FiltrosCrayola } from '@/features/marca/marca';
import { describeError } from '@/shared/models/app-error/describe-error';

/** Available to every route's `beforeLoad` and `loader` as `context`. */
export interface RouterContext {
	queryClient: QueryClient;
}

// Devtools are dev-only and lazy, so they never reach the production bundle.
const Devtools = env.isDev
	? lazy(() => import('@/app/components/devtools').then(m => ({ default: m.Devtools })))
	: () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	notFoundComponent: NoEncontrada,
	// The root error screen replaces the whole layout, so it brings its own language provider.
	errorComponent: ({ error, reset }) => (
		<IdiomaProvider>
			<ErrorDePantalla error={error} onReintentar={reset} />
		</IdiomaProvider>
	)
});

function RootLayout() {
	return (
		<IdiomaProvider>
			<SesionProvider>
				<FiltrosCrayola />
				<div className="flex h-dvh flex-col">
					<SaltarAlContenido />
					<BarraSuperior />
					<main id="contenido" className="relative min-h-0 flex-1 overflow-y-auto">
						<Outlet />
					</main>
				</div>
				<Suspense>
					<Devtools />
				</Suspense>
			</SesionProvider>
		</IdiomaProvider>
	);
}

function SaltarAlContenido() {
	const { t } = useIdioma();
	return (
		<a
			href="#contenido"
			className="boton boton-primario sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
		>
			{t.barra.saltar}
		</a>
	);
}

function NoEncontrada() {
	const { t } = useIdioma();
	return (
		<div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-6 py-24 text-center">
			<h1 className="crayola text-4xl font-bold">{t.estado.paginaNoExiste}</h1>
			<p className="text-lg">{t.estado.paginaNoExisteDetalle}</p>
			<Link to="/" className="boton boton-primario">
				{t.estado.irAlInicio}
			</Link>
		</div>
	);
}

function ErrorDePantalla({ error, onReintentar }: { error: unknown; onReintentar: () => void }) {
	const { t } = useIdioma();
	return (
		<div
			role="alert"
			className="mx-auto flex max-w-lg flex-col items-center gap-5 px-6 py-24 text-center"
		>
			<h1 className="text-3xl font-bold">{t.estado.error.otro.titulo}</h1>
			<p className="text-lg">{t.estado.error.otro.detalle}</p>
			<p className="etiqueta">{describeError(error, '')}</p>
			<button type="button" className="boton boton-primario" onClick={onReintentar}>
				{t.estado.reintentar}
			</button>
		</div>
	);
}
