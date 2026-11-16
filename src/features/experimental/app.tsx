import { useEffect, useState } from 'react';

import { FiltrosCrayola } from '@/features/marca/marca';

import { catalogSchema, loadDataset, readJson, type Dataset, type Site } from './data';
import { Workspace } from './workspace';

import './experimental.css';

/**
 * Catálogo de sitios del laboratorio. Sin variable se lee del mismo origen (despliegue en EC2);
 * en GitHub Pages apunta a los archivos publicados en api.mangroove.earth.
 */
const catalogUrl = new URL(
	import.meta.env.VITE_LABORATORIO_CATALOGO_URL || '/archivos/laboratorio/vigente.json',
	window.location.origin
).href;
export function ExperimentalApp() {
	const [sites, setSites] = useState<Site[]>([]);
	const [dataset, setDataset] = useState<Dataset | null>(null);
	const [error, setError] = useState('');
	useEffect(() => {
		// Fetch the map module alongside metadata; the small shell can paint first.
		void import('./map').catch(() => undefined); // The map boundary provides recovery.
		const controller = new AbortController();
		const slug = window.location.pathname.replace(/\/+$/, '').split('/').pop();
		readJson(catalogUrl, catalogSchema, controller.signal)
			.then(async catalog => {
				const site = catalog.sitios.find(
					s => s.id === (slug === 'laboratorio' ? 'chismuyo' : slug)
				);
				if (!site) throw new Error('Este sitio no está incluido en el laboratorio.');
				const loaded = await loadDataset(site, catalogUrl, controller.signal);
				setSites(catalog.sitios);
				setDataset(loaded);
			})
			.catch(e => {
				if (!controller.signal.aborted)
					setError(e instanceof Error ? e.message : 'No hay conexión con los datos.');
			});
		return () => controller.abort();
	}, []);
	return (
		<div className="lab-shell">
			<FiltrosCrayola />
			{dataset ? (
				<Workspace key={dataset.manifestUrl} dataset={dataset} sites={sites} />
			) : (
				<main className="panel lab-loading" role={error ? 'alert' : 'status'}>
					<img
						src={`${import.meta.env.BASE_URL}marca/mangroove.svg`}
						alt="Mangroove"
						width="100"
					/>
					<h1>{error ? 'No pudimos abrir el estuario' : 'Abriendo el estuario'}</h1>
					<p>{error || 'Cargando las pasadas del radar y la partitura de la marea…'}</p>
					{error && (
						<div className="flex flex-wrap gap-3">
							<button
								className="boton boton-primario"
								onClick={() => window.location.reload()}
							>
								Reintentar
							</button>
							<a className="boton boton-contorno" href="/laboratorio/chismuyo">
								Abrir Chismuyo
							</a>
						</div>
					)}
				</main>
			)}
		</div>
	);
}
