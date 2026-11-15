import { useEffect, useRef, useState } from 'react';

import {
	assetUrl,
	catalogSchema,
	formatP,
	loadCell,
	loadDataset,
	percent,
	readJson,
	stateLabels,
	type Cell,
	type Dataset,
	type Site
} from './data';
import { ExperimentalMap, layerLabels, type Layer } from './map';

import './experimental.css';

const catalogUrl = new URL('/archivos/laboratorio/vigente.json', window.location.origin).href;
const number = (n: number | null, digits = 2) =>
	n === null ? 'Sin dato' : n.toLocaleString('es-NI', { maximumFractionDigits: digits });
const direction = (d: string) => (d === 'asc' ? 'Ascendente' : 'Descendente');
function ErrorPanel({ message }: { message: string }) {
	return (
		<div className="exp-message" role="alert">
			<h2>No pudimos abrir los resultados</h2>
			<p>{message}</p>
			<button onClick={() => window.location.reload()}>Volver a intentar</button>
			<a href="https://mangroove.earth">Ir a Mangroove</a>
		</div>
	);
}

export function ExperimentalApp() {
	const [sites, setSites] = useState<Site[]>([]);
	const [dataset, setDataset] = useState<Dataset | null>(null);
	const [error, setError] = useState('');
	useEffect(() => {
		const controller = new AbortController();
		const slug = window.location.pathname.replace(/\/+$/, '').split('/').pop();
		readJson(catalogUrl, catalogSchema, controller.signal)
			.then(async catalog => {
				const requested = slug === 'laboratorio' ? 'aserradores' : slug;
				const site = catalog.sitios.find(s => s.id === requested);
				if (!site)
					throw new Error(
						'Este sitio no está incluido en el laboratorio. Abre /laboratorio/aserradores.'
					);
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
		<main className="exp-app">
			<header className="exp-header">
				<a className="exp-brand" href="https://mangroove.earth">
					Mangroove
				</a>
				<span>Laboratorio de estuarios</span>
				<a href="https://mangroove.earth/explorar">Explorador publicado ↗</a>
			</header>
			{error ? (
				<ErrorPanel message={error} />
			) : !dataset ? (
				<div className="exp-message" role="status">
					<h1>Abriendo el estuario</h1>
					<p>Cargando el mapa y su informe de calidad…</p>
				</div>
			) : (
				<Workspace key={dataset.manifestUrl} dataset={dataset} sites={sites} />
			)}
		</main>
	);
}
function Workspace({ dataset, sites }: { dataset: Dataset; sites: Site[] }) {
	const { manifest: m, quality: q, site } = dataset;
	const [date, setDate] = useState(
		m.fechas.findIndex(d => d.fecha_id === '2026-08-15_asc') >= 0
			? m.fechas.findIndex(d => d.fecha_id === '2026-08-15_asc')
			: 0
	);
	const [layer, setLayer] = useState<Layer>('clases');
	const [selected, setSelected] = useState<Cell | null>(null);
	const [cellMessage, setCellMessage] = useState(
		'Selecciona un punto del mapa para ver su serie.'
	);
	const [cellBusy, setCellBusy] = useState(false);
	const request = useRef(0);
	const current = m.fechas[date]!;
	async function inspect(lon: number, lat: number) {
		const id = ++request.current;
		setCellBusy(true);
		setSelected(null);
		setCellMessage('Cargando la celda…');
		try {
			const cell = await loadCell(dataset, lon, lat);
			if (id !== request.current) return;
			setSelected(cell);
			setCellMessage(cell ? '' : 'El punto queda fuera de la grilla de análisis.');
		} catch (e) {
			if (id === request.current)
				setCellMessage(e instanceof Error ? e.message : 'No se pudo leer la celda.');
		} finally {
			if (id === request.current) setCellBusy(false);
		}
	}
	const tests = [
		[
			'Marea · clases',
			q.prueba_marea.clases.aprobada,
			`r ${number(q.prueba_marea.clases.r, 3)} · p ${formatP(q.prueba_marea.clases.p)}`
		],
		[
			'Marea · señal HH',
			q.prueba_marea.senal_hh.aprobada,
			`r ${number(q.prueba_marea.senal_hh.r, 3)} · p ${formatP(q.prueba_marea.senal_hh.p)}`
		],
		[
			'Agua permanente',
			q.clases_fijas.agua_permanente_ow.aprobada,
			percent(q.clases_fijas.agua_permanente_ow.acierto)
		],
		[
			'Tierra firme',
			q.clases_fijas.tierra_firme_no_iv.aprobada,
			percent(q.clases_fijas.tierra_firme_no_iv.acierto)
		]
	] as const;
	return (
		<>
			<section className="exp-title">
				<div>
					<h1>{site.nombre}</h1>
					<p>{m.fechas.length} adquisiciones NISAR · píxel de 10 m · celdas de 1 ha</p>
				</div>
				<label>
					Sitio
					<select
						value={site.id}
						onChange={e => {
							window.location.href = `/laboratorio/${e.target.value}`;
						}}
					>
						{sites.map(s => (
							<option key={s.id} value={s.id}>
								{s.nombre}
							</option>
						))}
					</select>
				</label>
			</section>
			<p className="exp-notice">
				<strong>Resultados experimentales.</strong> Los controles internos no sustituyen la
				validación en campo. Se observó el {percent(m.marea.pleamar_rel)} de la pleamar
				máxima predicha.
			</p>
			<div className="exp-workspace">
				<section className="exp-map-section" aria-label="Exploración del mapa">
					<div className="exp-toolbar">
						<label>
							Capa
							<select value={layer} onChange={e => setLayer(e.target.value as Layer)}>
								{Object.entries(layerLabels).map(([k, v]) => (
									<option key={k} value={k}>
										{v}
									</option>
								))}
							</select>
						</label>
						<label>
							Adquisición
							<select value={date} onChange={e => setDate(Number(e.target.value))}>
								{m.fechas.map((d, i) => (
									<option key={d.fecha_id} value={i}>
										{d.fecha} · {direction(d.direccion)}
									</option>
								))}
							</select>
						</label>
					</div>
					<ExperimentalMap
						dataset={dataset}
						date={current.fecha_id}
						layer={layer}
						selected={selected}
						onPoint={(lon, lat) => void inspect(lon, lat)}
					/>
					<div className="exp-date">
						<button
							aria-label="Adquisición anterior"
							disabled={date === 0}
							onClick={() => setDate(date - 1)}
						>
							Anterior
						</button>
						<div>
							<strong>
								{current.fecha} · {direction(current.direccion)}
							</strong>
							<span>
								Marea {number(current.marea_m, 3)} m · {current.marea_nivel}
								{current.sospechosa ? ' · calibración a revisar' : ''}
							</span>
						</div>
						<button
							aria-label="Adquisición siguiente"
							disabled={date === m.fechas.length - 1}
							onClick={() => setDate(date + 1)}
						>
							Siguiente
						</button>
					</div>
					<Legend layer={layer} dataset={dataset} />
					{layer !== 'clases' && layer !== 'rgb' && (
						<p className="exp-caption">
							Esta capa resume todas las adquisiciones; no cambia con la fecha
							seleccionada.
						</p>
					)}
				</section>
				<aside
					className="exp-inspector"
					aria-label="Inspector de celda"
					aria-busy={cellBusy}
				>
					<h2>La marea en esta celda</h2>
					{selected ? (
						<Inspector
							cell={selected}
							dataset={dataset}
							selectedDate={current.fecha_id}
						/>
					) : (
						<>
							<p role="status">{cellMessage}</p>
							<p className="exp-caption">
								También puedes consultar el punto de referencia del sitio.
							</p>
							<button
								disabled={cellBusy}
								onClick={() => void inspect(...m.region.centro)}
							>
								Inspeccionar el centro
							</button>
						</>
					)}
				</aside>
			</div>
			<section className="exp-quality">
				<div>
					<h2>Qué respaldan las pruebas</h2>
					<p>
						Cuatro controles internos, evaluados con las mismas adquisiciones. Los
						valores p son unilaterales y no están ajustados por comparar varios sitios.
					</p>
				</div>
				<table>
					<caption>Controles del área completa</caption>
					<thead>
						<tr>
							<th>Control</th>
							<th>Resultado</th>
							<th>Evidencia</th>
						</tr>
					</thead>
					<tbody>
						{tests.map(([name, passed, value]) => (
							<tr key={name}>
								<th scope="row">{name}</th>
								<td className={passed ? 'exp-pass' : 'exp-fail'}>
									{passed ? 'Pasa' : 'No pasa'}
								</td>
								<td>{value}</td>
							</tr>
						))}
					</tbody>
				</table>
				<div className="exp-track">
					<h3>La prueba de clases, por pista</h3>
					{Object.entries(q.prueba_marea.clases_por_pila).map(([track, t]) => (
						<p key={track}>
							<strong>{track.includes('asc') ? 'Ascendente' : 'Descendente'}</strong>
							<span>
								{t.aprobada ? 'Pasa' : 'No pasa'} · r {number(t.r, 3)} · p{' '}
								{formatP(t.p)}
							</span>
						</p>
					))}
				</div>
				<details className="exp-limitations">
					<summary>Limitaciones y procedencia</summary>
					<p>
						Modelo de marea: {m.marea.modelo}. Sin desfase local estimado. La exactitud
						con muestras independientes{' '}
						{m.calidad.exactitud === null
							? 'no se ha medido'
							: `es ${percent(m.calidad.exactitud)}`}
						.
					</p>
					<ul>
						{q.advertencias.map((warning, i) => (
							<li key={i}>
								{warning.replace(
									'La marea es la del golfo abierto',
									'La marea proviene del modelo regional'
								)}
							</li>
						))}
					</ul>
					<p>
						Publicación {site.publicacion} · contrato {m.version} · motor{' '}
						{m.motor.version}. NISAR: NASA/JPL-Caltech e ISRO; distribución ASF DAAC.
						Máscara de manglar: GMW 2020.
					</p>
				</details>
			</section>
			<footer className="exp-footer">
				<span>Datos y método a la vista</span>
				<a
					href={assetUrl(m.datos.calidad, dataset.manifestUrl)}
					target="_blank"
					rel="noreferrer"
				>
					Informe de calidad JSON
				</a>
				<a href={assetUrl(m.datos.resumen, dataset.manifestUrl)} download>
					Resumen CSV
				</a>
				<a href={dataset.manifestUrl} target="_blank" rel="noreferrer">
					Manifest de la publicación
				</a>
			</footer>
		</>
	);
}
function Legend({ layer, dataset }: { layer: Layer; dataset: Dataset }) {
	const classes = [
		['IV', 'Vegetación inundada'],
		['OW', 'Agua abierta'],
		['NI', 'No inundado'],
		['NC', 'No clasificado']
	];
	if (layer === 'clases')
		return (
			<ul className="exp-legend" aria-label="Leyenda">
				{classes.map(([k, label]) => (
					<li key={k}>
						<i
							style={{
								background: dataset.manifest.capas.colores_clases?.[k!] ?? '#999'
							}}
						/>
						{label}
					</li>
				))}
			</ul>
		);
	if (layer === 'rgb')
		return (
			<p className="exp-caption">
				Rojo: HH · verde: HV · azul: HH − HV. El color representa intensidad del radar, no
				una fotografía.
			</p>
		);
	if (layer === 'estado')
		return (
			<ul className="exp-legend">
				<li>
					<i style={{ background: '#2f5f50' }} />
					Conexión compatible
				</li>
				<li>
					<i style={{ background: '#bc9435' }} />
					Baja frecuencia
				</li>
				<li>
					<i style={{ background: '#3987e5' }} />
					Persistente
				</li>
				<li>
					<i style={{ background: '#9a9893' }} />
					Insuficiente
				</li>
			</ul>
		);
	return (
		<p className="exp-caption">
			{layer === 'sens_db_m'
				? 'Respuesta HH en dB/m: marrón ≤ −0,5 · papel 0 · verde ≥ 0,5. Gris: sin estimación. La intensidad del color no indica significancia estadística.'
				: 'Frecuencia de inundación: papel 0 % · azul 100 %. Gris: sin estimación. Solo se muestran celdas de manglar.'}
		</p>
	);
}
function Inspector({
	cell: c,
	dataset,
	selectedDate
}: {
	cell: Cell;
	dataset: Dataset;
	selectedDate: string;
}) {
	const metric = c.metricas;
	const now = c.serie.find(p => p.fecha_id === selectedDate);
	return (
		<>
			<p className="exp-coordinate">
				{number(c.centroide[1], 5)}° N · {number(Math.abs(c.centroide[0]), 5)}° O
			</p>
			<p className="exp-cell-state">
				{!c.en_mascara
					? 'Fuera de la máscara de manglar'
					: metric
						? stateLabels[metric.estado]
						: 'Sin métricas disponibles'}
			</p>
			{metric && (
				<>
					<dl className="exp-metrics">
						<div>
							<dt>Inundación · todas</dt>
							<dd>{percent(metric.if)}</dd>
						</div>
						<div>
							<dt>En marea alta</dt>
							<dd>{percent(metric.if_alta)}</dd>
						</div>
						<div>
							<dt>En marea baja</dt>
							<dd>{percent(metric.if_baja)}</dd>
						</div>
						<div>
							<dt>Respuesta HH</dt>
							<dd>{number(metric.sens_db_m)} dB/m</dd>
						</div>
						<div>
							<dt>p de respuesta HH</dt>
							<dd>{metric.sens_p === 0 ? '< 0,001' : number(metric.sens_p, 3)}</dd>
						</div>
						<div>
							<dt>Fechas alta / baja</dt>
							<dd>
								{metric.n_fechas_alta} / {metric.n_fechas_baja}
							</dd>
						</div>
					</dl>
					<p className="exp-caption">
						{percent(metric.p_error)} de fechas cerca de un umbral. No es exactitud
						validada. Los valores p por celda están redondeados.
					</p>
				</>
			)}
			<p>
				<strong>Fecha seleccionada:</strong> {now?.clase ?? 'Sin dato'} · HH{' '}
				{number(now?.hh_db ?? null)} dB
			</p>
			<Series cell={c} dataset={dataset} />
			<details>
				<summary>Ver las {c.serie.length} observaciones</summary>
				<div className="exp-series-table">
					<table>
						<thead>
							<tr>
								<th>Fecha / pista</th>
								<th>HH dB</th>
								<th>HV dB</th>
								<th>Clase</th>
							</tr>
						</thead>
						<tbody>
							{c.serie.map(p => (
								<tr key={p.fecha_id}>
									<th scope="row">
										{p.fecha_id.replace('_asc', ' ↑').replace('_desc', ' ↓')}
									</th>
									<td>{number(p.hh_db)}</td>
									<td>{number(p.hv_db)}</td>
									<td>{p.clase ?? 'Sin dato'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
			{c.cambio && (
				<p className="exp-change">
					Cambio de copa candidato: {c.cambio.fecha_id.slice(0, 10)}, ΔHV{' '}
					{number(c.cambio.delta_hv_db)} dB. Requiere verificación independiente.
				</p>
			)}
		</>
	);
}
function Series({ cell, dataset }: { cell: Cell; dataset: Dataset }) {
	const values = cell.serie.map(p => p.hh_db).filter((v): v is number => v !== null);
	if (!values.length) return <p>No hay señal HH válida para graficar.</p>;
	const low = Math.floor(Math.min(...values)) - 0.5,
		high = Math.ceil(Math.max(...values)) + 0.5;
	const x = (i: number) => 36 + (i * 264) / Math.max(1, cell.serie.length - 1),
		y = (v: number) => 120 - ((v - low) * 96) / (high - low);
	// Individual segments preserve gaps: null observations never become zero or a bridge.
	return (
		<figure className="exp-series">
			<figcaption>Señal HH de la celda · dB</figcaption>
			<svg
				viewBox="0 0 320 154"
				role="img"
				aria-label="Evolución de HH en las veinte adquisiciones. Los valores exactos están en la tabla."
			>
				{[low, (low + high) / 2, high].map(v => (
					<g key={v}>
						<line x1="36" x2="300" y1={y(v)} y2={y(v)} stroke="#cad0c0" />
						<text x="30" y={y(v) + 4} textAnchor="end">
							{number(v, 1)}
						</text>
					</g>
				))}
				{cell.serie.map((p, i) => {
					const prev = cell.serie[i - 1];
					return p.hh_db !== null ? (
						<g key={p.fecha_id}>
							{prev?.hh_db !== undefined && prev.hh_db !== null && (
								<line
									x1={x(i - 1)}
									y1={y(prev.hh_db)}
									x2={x(i)}
									y2={y(p.hh_db)}
									stroke="#0f7f9e"
									strokeWidth="2"
								/>
							)}
							<circle cx={x(i)} cy={y(p.hh_db)} r="3" fill="#0f7f9e">
								<title>
									{p.fecha_id}: {p.hh_db} dB; marea{' '}
									{dataset.manifest.fechas[i]?.marea_m} m
								</title>
							</circle>
						</g>
					) : null;
				})}
				<text x="36" y="146">
					{cell.serie[0]?.fecha_id.slice(5, 10)}
				</text>
				<text x="300" y="146" textAnchor="end">
					{cell.serie.at(-1)?.fecha_id.slice(5, 10)}
				</text>
			</svg>
		</figure>
	);
}
