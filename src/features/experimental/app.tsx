import { useEffect, useState } from 'react';

import { FiltrosCrayola } from '@/features/marca/marca';

import { catalogSchema, loadDataset, readJson, type Dataset, type Site } from './data';
import { Workspace } from './workspace';

import './experimental.css';

const catalogUrl = new URL('/archivos/laboratorio/vigente.json', window.location.origin).href;
export function ExperimentalApp() {
	const [sites, setSites] = useState<Site[]>([]);
	const [dataset, setDataset] = useState<Dataset | null>(null);
	const [error, setError] = useState('');
	useEffect(() => {
		const controller = new AbortController();
		const slug = window.location.pathname.replace(/\/+$/, '').split('/').pop();
		readJson(catalogUrl, catalogSchema, controller.signal)
			.then(async catalog => {
				const site = catalog.sitios.find(
					s => s.id === (slug === 'laboratorio' ? 'aserradores' : slug)
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
							<a className="boton boton-contorno" href="/laboratorio/aserradores">
								Abrir Aserradores
							</a>
						</div>
					)}
				</main>
			)}
		</div>
	);
}
