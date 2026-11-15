import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { busquedaSchema } from '@/features/explorar/busqueda';
import { Explorar, type CambiarBusqueda } from '@/features/explorar/explorar';

export const Route = createFileRoute('/explorar')({
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
