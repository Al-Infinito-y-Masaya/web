import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { env } from '@/config/env';
import { busquedaSchema } from '@/features/explorar/busqueda';
import { Explorar, type CambiarBusqueda } from '@/features/explorar/explorar';

export const Route = createFileRoute('/explorar')({
	beforeLoad: () => {
		if (env.experimentalExplorer)
			throw redirect({ href: '/laboratorio/chismuyo', reloadDocument: true });
	},
	validateSearch: search => busquedaSchema.parse(search),
	component: PaginaExplorar
});

function PaginaExplorar() {
	const busqueda = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const cambiar = useCallback<CambiarBusqueda>(
		(cambios, opciones) => {
			void navigate({
				search: previa => ({ ...previa, ...cambios }),
				replace: opciones?.reemplazar ?? false,
				resetScroll: false
			});
		},
		[navigate]
	);

	return <Explorar busqueda={busqueda} onBusqueda={cambiar} />;
}
