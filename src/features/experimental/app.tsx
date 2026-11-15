import { useEffect, useState } from 'react';

import { FiltrosCrayola } from '@/features/marca/marca';

import { catalogSchema, loadDataset, readJson, type Dataset, type Site } from './data';
import { useLab } from './textos';
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

class SitioFaltante extends Error {}

export function ExperimentalApp() {
	const { t } = useLab();
	const [sites, setSites] = useState<Site[]>([]);
	const [dataset, setDataset] = useState<Dataset | null>(null);
	const [error, setError] = useState<'' | 'sitio' | 'datos'>('');
	useEffect(() => {
		document.title = t.tituloPagina;
	}, [t]);
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
				if (!site) throw new SitioFaltante();
				const loaded = await loadDataset(site, catalogUrl, controller.signal);
				setSites(catalog.sitios);
				setDataset(loaded);
			})
			.catch(e => {
				if (!controller.signal.aborted)
					setError(e instanceof SitioFaltante ? 'sitio' : 'datos');
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
					<h1>{error ? t.app.error : t.app.cargando}</h1>
					<p>
						{error === 'sitio'
							? t.app.sitioFaltante
							: error === 'datos'
								? t.app.errorDatos
								: t.app.cargandoTexto}
					</p>
					{error && (
						<div className="flex flex-wrap gap-3">
							<button
								className="boton boton-primario"
								onClick={() => window.location.reload()}
							>
								{t.app.reintentar}
							</button>
							<a className="boton boton-contorno" href="/laboratorio/chismuyo">
								{t.app.abrirChismuyo}
							</a>
						</div>
					)}
				</main>
			)}
		</div>
	);
}
