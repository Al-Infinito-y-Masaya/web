import {
	Activity,
	Check,
	ChevronDown,
	Database,
	Layers,
	MapPin,
	Music2,
	ScanLine,
	Share2,
	ShieldCheck,
	Waves,
	X,
	type LucideIcon
} from 'lucide-react';
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode
} from 'react';

import { rangoDeMarea } from '@/features/datos/dominio';
import { Reproductor } from '@/features/explorar/reproductor';
import { useIdioma } from '@/features/idioma/idioma';
import { FranjaManglar } from '@/features/marca/marca';
import { sonido } from '@/features/partitura/sonido';

import { assetUrl, formatP, loadCell, percent, type Cell, type Dataset, type Site } from './data';
import { Inspector, Legend } from './details';
import { layerLabels, type Layer, type MapStatus } from './layers';
import { MapBoundary } from './map-boundary';
import { neighborDates, stepDate } from './stepping';
import { timelineData } from './timeline';

const ExperimentalMap = lazy(() =>
	import('./map').then(module => ({ default: module.ExperimentalMap }))
);

const number = (v: number | null, n = 3) =>
	v === null ? 'Sin dato' : v.toLocaleString('es-NI', { maximumFractionDigits: n });
type WidgetId = 'pass' | 'layers' | 'cell' | 'quality' | 'tide' | 'data';
function Widget({
	title,
	icon: Icon,
	summary,
	open,
	onOpen,
	children
}: {
	title: string;
	icon: LucideIcon;
	summary?: string;
	open: boolean;
	onOpen: (value: boolean) => void;
	children: ReactNode;
}) {
	const id = title.replaceAll(' ', '-');
	return (
		<section className="lab-widget">
			<h2>
				<button
					className="lab-widget-toggle"
					aria-expanded={open}
					aria-controls={id}
					onClick={() => onOpen(!open)}
				>
					<Icon size={19} aria-hidden />
					<span>
						{title}
						{summary && <small>{summary}</small>}
					</span>
					<ChevronDown size={17} className={open ? 'lab-chevron-open' : ''} aria-hidden />
				</button>
			</h2>
			<div id={id} hidden={!open} className="lab-widget-body">
				{children}
			</div>
		</section>
	);
}

export function Workspace({ dataset, sites }: { dataset: Dataset; sites: Site[] }) {
	const { manifest: m, quality: q, site } = dataset;
	const { fmt } = useIdioma();
	const score = useMemo(() => timelineData(m), [m]);
	const range = useMemo(() => rangoDeMarea(score.fechas), [score]);
	const initial = new URLSearchParams(window.location.search);
	const initialIndex = m.fechas.findIndex(d => d.fecha_id === initial.get('fecha'));
	const [date, setDate] = useState(
		initialIndex >= 0
			? initialIndex
			: Math.max(
					0,
					m.fechas.findIndex(d => d.fecha_id === '2026-08-15_asc')
				)
	);
	const [layer, setLayer] = useState<Layer>(() =>
		Object.hasOwn(layerLabels, initial.get('capa') ?? '')
			? (initial.get('capa') as Layer)
			: 'rgb'
	);
	const [playing, setPlaying] = useState(false);
	// The score is followed note by note; `?orbita=misma` steps within one orbit, whose
	// dates share a viewing geometry (different orbits differ in brightness by geometry alone).
	const [sameOrbit, setSameOrbit] = useState(initial.get('orbita') === 'misma');
	const [mapStatus, setMapStatus] = useState<MapStatus>({ key: '', loading: true, error: false });
	const [selected, setSelected] = useState<Cell | null>(null);
	const [cellMessage, setCellMessage] = useState(
		'Elegí un punto del mapa para conocer su respuesta a la marea.'
	);
	const [busy, setBusy] = useState(false);
	const [widgets, setWidgets] = useState<Record<WidgetId, boolean>>({
		pass: true,
		layers: false,
		cell: false,
		quality: false,
		tide: false,
		data: false
	});
	const [copied, setCopied] = useState(false);
	const [shareError, setShareError] = useState(false);
	const request = useRef(0);
	const current = m.fechas[date]!;
	const temporal = layer === 'rgb' || layer === 'clases';
	const mapPending = mapStatus.key !== `${layer}:${current.fecha_id}` || mapStatus.loading;
	const mapFailed = mapStatus.key === `${layer}:${current.fecha_id}` && mapStatus.error;
	const sounding = !mapPending && !mapFailed && temporal ? current.fecha_id : null;
	const updateMapStatus = useCallback((value: MapStatus) => {
		setMapStatus(previous =>
			previous.key === value.key &&
			previous.loading === value.loading &&
			previous.error === value.error
				? previous
				: value
		);
		if (value.error) setPlaying(false);
	}, []);
	const open = (id: WidgetId, value: boolean) => setWidgets(w => ({ ...w, [id]: value }));
	const selectDate = useCallback(
		(id: string, automatic = false) => {
			const index = m.fechas.findIndex(d => d.fecha_id === id);
			if (index < 0) return;
			if (!automatic) setPlaying(false);
			setDate(index);
		},
		[m]
	);
	const neighbors = useMemo(
		() => neighborDates(m.fechas, date, sameOrbit).map(i => m.fechas[i]!.fecha_id),
		[m, date, sameOrbit]
	);
	useEffect(() => {
		if (!playing || mapPending || mapFailed) return;
		const timer = window.setTimeout(
			() => selectDate(m.fechas[stepDate(m.fechas, date, 1, sameOrbit)]!.fecha_id, true),
			1300
		);
		return () => window.clearTimeout(timer);
	}, [playing, date, m, selectDate, mapPending, mapFailed, sameOrbit]);
	useEffect(() => {
		if (mapPending || mapFailed || !temporal) return;
		sonido.tocarMarea(current.marea_m, range, false);
	}, [current, range, temporal, mapPending, mapFailed]);
	useEffect(() => {
		const url = new URL(window.location.href);
		url.searchParams.set('fecha', current.fecha_id);
		url.searchParams.set('capa', layer);
		if (sameOrbit) url.searchParams.set('orbita', 'misma');
		else url.searchParams.delete('orbita');
		window.history.replaceState(null, '', url);
	}, [current.fecha_id, layer, sameOrbit]);
	useEffect(() => {
		if (!copied) return;
		const timer = window.setTimeout(() => setCopied(false), 2400);
		return () => window.clearTimeout(timer);
	}, [copied]);
	async function inspect(lon: number, lat: number) {
		const id = ++request.current;
		setBusy(true);
		setSelected(null);
		open('cell', true);
		setCellMessage('Cargando la celda…');
		try {
			const cell = await loadCell(dataset, lon, lat);
			if (id !== request.current) return;
			setSelected(cell);
			setCellMessage(cell ? '' : 'Este punto está fuera de la grilla del análisis.');
		} catch (e) {
			if (id === request.current)
				setCellMessage(e instanceof Error ? e.message : 'No se pudo cargar la celda.');
		} finally {
			if (id === request.current) setBusy(false);
		}
	}
	function chooseLayer(value: Layer) {
		setLayer(value);
		setPlaying(false);
	}
	const controls = [
		{
			name: 'Marea · clases',
			passed: q.prueba_marea.clases.aprobada,
			evidence: `r ${number(q.prueba_marea.clases.r)} · p ${formatP(q.prueba_marea.clases.p)}`
		},
		{
			name: 'Marea · señal HH',
			passed: q.prueba_marea.senal_hh.aprobada,
			evidence: `r ${number(q.prueba_marea.senal_hh.r)} · p ${formatP(q.prueba_marea.senal_hh.p)}`
		},
		{
			name: 'Agua permanente',
			passed: q.clases_fijas.agua_permanente_ow.aprobada,
			evidence: percent(q.clases_fijas.agua_permanente_ow.acierto)
		},
		{
			name: 'Tierra firme',
			passed: q.clases_fijas.tierra_firme_no_iv.aprobada,
			evidence: percent(q.clases_fijas.tierra_firme_no_iv.acierto)
		}
	];
	return (
		<>
			<header className="papel lab-header">
				<a href="https://mangroove.earth" aria-label="Mangroove, ir al inicio">
					<img
						src={`${import.meta.env.BASE_URL}marca/mangroove.svg`}
						alt=""
						className="lab-logo"
					/>
				</a>
				<nav aria-label="Secciones" className="lab-nav">
					<a className="boton boton-fantasma" href="https://mangroove.earth/historia">
						Historia
					</a>
					<a
						className="boton boton-fantasma bg-manglar-arena"
						href={`/laboratorio/${site.id}`}
						aria-current="page"
					>
						Explorar
					</a>
					<a className="boton boton-fantasma" href="https://mangroove.earth/metodo">
						Método y datos
					</a>
				</nav>
				<label className="lab-site">
					<MapPin size={17} aria-hidden />
					<span className="sr-only">Estuario</span>
					<select
						aria-label="Estuario"
						value={site.id}
						onChange={e => {
							setPlaying(false);
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
				<span className="lab-release">NISAR · experimental</span>
				<button
					className="boton boton-fantasma lab-share"
					onClick={() => {
						navigator.clipboard
							.writeText(window.location.href)
							.then(() => {
								setCopied(true);
								setShareError(false);
							})
							.catch(() => setShareError(true));
					}}
				>
					{copied ? <Check size={17} aria-hidden /> : <Share2 size={17} aria-hidden />}
					<span>{copied ? 'Copiado' : 'Compartir'}</span>
				</button>
			</header>
			{shareError && (
				<p className="lab-share-error" role="status">
					No se pudo copiar el enlace. Podés copiar la dirección del navegador.
					<button onClick={() => setShareError(false)} aria-label="Cerrar aviso">
						<X size={16} />
					</button>
				</p>
			)}
			<main className="lab-stage" id="contenido">
				<div className="lab-map-zone">
					<MapBoundary>
						<Suspense
							fallback={
								<p className="exp-map-message" role="status">
									Preparando el mapa…
								</p>
							}
						>
							<ExperimentalMap
								dataset={dataset}
								date={current.fecha_id}
								layer={layer}
								neighbors={temporal ? neighbors : []}
								selected={selected}
								onPoint={(lon, lat) => void inspect(lon, lat)}
								onStatus={updateMapStatus}
								embedded
							/>
						</Suspense>
					</MapBoundary>
				</div>
				<div className="lab-modes papel" role="group" aria-label="Modos de exploración">
					<button aria-pressed={temporal} onClick={() => chooseLayer('rgb')}>
						<Music2 size={17} aria-hidden />
						El ritmo
					</button>
					<button
						aria-pressed={!temporal}
						onClick={() => {
							chooseLayer('if_alta');
							open('layers', true);
						}}
					>
						<Waves size={17} aria-hidden />
						En sintonía / fuera de ritmo
					</button>
				</div>
				<aside className="panel lab-sidebar" aria-label="Widgets del estuario">
					<div className="lab-sidebar-title">
						<h1>{temporal ? 'El ritmo' : 'La respuesta a la marea'}</h1>
						<p>
							{temporal
								? 'Elegí una pasada en la partitura para ver el radar y escuchar la marea.'
								: 'Explorá cómo cambia la inundación del manglar entre las mareas.'}
						</p>
					</div>
					<Widget
						title="La pasada"
						icon={Music2}
						summary={`${fmt.fechaLarga(current.hora_utc, 'America/Managua')} · ${current.marea_nivel}`}
						open={widgets.pass}
						onOpen={v => open('pass', v)}
					>
						<p className="lab-current-date">
							{fmt.fechaLarga(current.hora_utc, 'America/Managua')}
						</p>
						<p className="exp-caption">
							{fmt.hora(current.hora_utc, 'America/Managua')}, hora local de{' '}
							{site.nombre}
						</p>
						<dl className="lab-facts">
							<div>
								<dt>Órbita</dt>
								<dd>
									{current.direccion === 'asc' ? 'Ascendente' : 'Descendente'} ·
									pista {current.pista}
								</dd>
							</div>
							<div>
								<dt>Marea estimada</dt>
								<dd>
									{number(current.marea_m)} m · {current.marea_nivel}
								</dd>
							</div>
						</dl>
						<div className="lab-orbit">
							<p id="recorrido-titulo" className="lab-orbit-title">
								Recorrido de la partitura
							</p>
							<div
								className="lab-raster-switch lab-orbit-switch"
								role="group"
								aria-labelledby="recorrido-titulo"
							>
								<button
									aria-pressed={!sameOrbit}
									onClick={() => setSameOrbit(false)}
								>
									Nota por nota
								</button>
								<button aria-pressed={sameOrbit} onClick={() => setSameOrbit(true)}>
									Misma órbita
								</button>
							</div>
							<p className="exp-caption">
								{sameOrbit
									? `Salta a la siguiente pasada ${current.direccion === 'asc' ? 'ascendente' : 'descendente'}: compara el manglar siempre desde el mismo ángulo.`
									: 'Sigue la partitura en orden. Ascendentes y descendentes se alternan y miran el manglar desde ángulos distintos: el brillo puede cambiar aunque no cambie el agua.'}
							</p>
						</div>
						<div
							className="lab-raster-switch"
							role="group"
							aria-label="Qué muestra el mapa"
						>
							<button
								aria-pressed={layer === 'rgb'}
								onClick={() => chooseLayer('rgb')}
							>
								Radar RGB
							</button>
							<button
								aria-pressed={layer === 'clases'}
								onClick={() => chooseLayer('clases')}
							>
								Clases
							</button>
						</div>
						<Legend layer={layer} dataset={dataset} />
						{!temporal && (
							<p className="exp-caption">
								La capa resume todas las pasadas. La partitura mantiene la marea de
								cada adquisición.
							</p>
						)}
					</Widget>
					<Widget
						title="Capas del mapa"
						icon={Layers}
						summary={layerLabels[layer]}
						open={widgets.layers}
						onOpen={v => open('layers', v)}
					>
						<div className="lab-layer-list" role="group" aria-label="Capas disponibles">
							{Object.entries(layerLabels).map(([id, label]) => (
								<button
									key={id}
									aria-pressed={layer === id}
									onClick={() => chooseLayer(id as Layer)}
								>
									<span>{label}</span>
									{layer === id && <Check size={16} aria-hidden />}
								</button>
							))}
						</div>
					</Widget>
					<Widget
						title="Esta celda"
						icon={ScanLine}
						summary={
							selected
								? 'Serie y métricas de la selección'
								: 'Seleccioná un punto del mapa'
						}
						open={widgets.cell}
						onOpen={v => open('cell', v)}
					>
						<div aria-busy={busy}>
							{selected ? (
								<>
									<Inspector
										cell={selected}
										dataset={dataset}
										selectedDate={current.fecha_id}
									/>
									<button
										className="boton boton-contorno lab-small"
										onClick={() => {
											request.current++;
											setBusy(false);
											setSelected(null);
											setCellMessage('Elegí otro punto del mapa.');
										}}
									>
										Limpiar selección
									</button>
								</>
							) : (
								<>
									<p role="status">{cellMessage}</p>
									<button
										className="boton boton-contorno lab-small"
										disabled={busy}
										onClick={() => void inspect(...m.region.centro)}
									>
										Inspeccionar el centro
									</button>
								</>
							)}
						</div>
					</Widget>
					<Widget
						title="Pruebas de calidad"
						icon={ShieldCheck}
						summary={`${controls.filter(c => c.passed).length} de 4 controles globales pasan`}
						open={widgets.quality}
						onOpen={v => open('quality', v)}
					>
						<p className="exp-caption">
							Controles internos; la exactitud con muestras independientes aún no se
							ha medido.
						</p>
						<ul className="lab-quality">
							{controls.map(c => (
								<li key={c.name}>
									<div>
										<strong>{c.name}</strong>
										<span className={c.passed ? 'exp-pass' : 'exp-fail'}>
											{c.passed ? 'Pasa' : 'No pasa'}
										</span>
									</div>
									<small>{c.evidence}</small>
								</li>
							))}
						</ul>
						<h3>Clases, por pista</h3>
						<ul className="lab-quality">
							{Object.entries(q.prueba_marea.clases_por_pila).map(([track, t]) => (
								<li key={track}>
									<div>
										<strong>
											{track.includes('asc') ? 'Ascendente' : 'Descendente'}
										</strong>
										<span className={t.aprobada ? 'exp-pass' : 'exp-fail'}>
											{!t.evaluable
												? 'No evaluable'
												: t.aprobada
													? 'Pasa'
													: 'No pasa'}
										</span>
									</div>
									<small>
										r {number(t.r)} · p {formatP(t.p)}
									</small>
								</li>
							))}
						</ul>
						<p className="exp-caption">
							Valores p unilaterales, sin ajuste por comparar varios sitios.
						</p>
					</Widget>
					<Widget
						title="Marea y límites"
						icon={Activity}
						summary={`Pleamar observada: ${percent(m.marea.pleamar_rel)}`}
						open={widgets.tide}
						onOpen={v => open('tide', v)}
					>
						<p>
							Las pasadas alcanzan el {percent(m.marea.pleamar_rel)} de la pleamar
							máxima predicha. Una baja frecuencia observada no confirma desconexión.
						</p>
						<p className="exp-caption">
							Modelo {m.marea.modelo}, sin desfase local estimado. Cada nota
							representa una adquisición; su altura y sonido corresponden a la marea.
						</p>
						<ul className="lab-warnings">
							{q.advertencias.map((w, i) => (
								<li key={i}>{w}</li>
							))}
						</ul>
					</Widget>
					<Widget
						title="Datos y procedencia"
						icon={Database}
						summary={`${m.fechas.length} pasadas · 10 m · celdas de 1 ha`}
						open={widgets.data}
						onOpen={v => open('data', v)}
					>
						<p className="exp-caption">
							NISAR: NASA/JPL-Caltech e ISRO. Distribución: ASF DAAC. Máscara: GMW
							2020.
						</p>
						<div className="lab-downloads">
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
						</div>
						<p className="exp-caption">
							Datos {site.publicacion} · contrato {m.version} · motor{' '}
							{m.motor.version}.
						</p>
					</Widget>
					<p className="lab-experimental">
						Resultados experimentales. La validación independiente sigue pendiente.
					</p>
					<FranjaManglar className="lab-mangrove" />
				</aside>
				<div className="lab-score">
					<Reproductor
						manifiesto={score}
						seleccion={current.fecha_id}
						onSeleccion={id => selectDate(id)}
						sonando={sounding}
						modo={temporal ? 'pasada' : 'conectividad'}
						nota={
							mapFailed
								? 'La carga se detuvo. Reintentá desde el mapa.'
								: playing && mapPending
									? 'Esperando esta pasada. La música continúa cuando el mapa esté listo.'
									: undefined
						}
						transporte={{
							reproduciendo: playing,
							onReproducir: () => {
								if (!temporal) setLayer('clases');
								setPlaying(p => !p);
							},
							onPaso: delta =>
								selectDate(
									m.fechas[stepDate(m.fechas, date, delta, sameOrbit)]!.fecha_id
								)
						}}
					/>
				</div>
			</main>
		</>
	);
}
