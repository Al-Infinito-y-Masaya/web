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
import { FranjaManglar } from '@/features/marca/marca';
import { sonido } from '@/features/partitura/sonido';
import { cn } from '@/shared/utils/index';

import { assetUrl, formatP, loadCell, percent, type Cell, type Dataset, type Site } from './data';
import { Inspector, Legend } from './details';
import { LAYERS, type Layer, type MapStatus } from './layers';
import { MapBoundary } from './map-boundary';
import { neighborDates, stepDate } from './stepping';
import { useLab } from './textos';
import { timelineData } from './timeline';

const ExperimentalMap = lazy(() =>
	import('./map').then(module => ({ default: module.ExperimentalMap }))
);

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
	const { t, idioma, setIdioma, fmt, numero: number } = useLab();
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
		LAYERS.includes(initial.get('capa') as Layer) ? (initial.get('capa') as Layer) : 'rgb'
	);
	const [playing, setPlaying] = useState(false);
	// The score is followed note by note; `?orbita=misma` steps within one orbit, whose
	// dates share a viewing geometry (different orbits differ in brightness by geometry alone).
	const [sameOrbit, setSameOrbit] = useState(initial.get('orbita') === 'misma');
	const [mapStatus, setMapStatus] = useState<MapStatus>({ key: '', loading: true, error: false });
	const [selected, setSelected] = useState<Cell | null>(null);
	const [cellMessage, setCellMessage] = useState<
		'elegir' | 'cargando' | 'fuera' | 'error' | 'otra'
	>('elegir');
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
		setCellMessage('cargando');
		try {
			const cell = await loadCell(dataset, lon, lat);
			if (id !== request.current) return;
			setSelected(cell);
			if (!cell) setCellMessage('fuera');
		} catch {
			if (id === request.current) setCellMessage('error');
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
			name: t.calidad.mareaClases,
			passed: q.prueba_marea.clases.aprobada,
			evidence: `r ${number(q.prueba_marea.clases.r)} · p ${formatP(q.prueba_marea.clases.p, t)}`
		},
		{
			name: t.calidad.mareaHh,
			passed: q.prueba_marea.senal_hh.aprobada,
			evidence: `r ${number(q.prueba_marea.senal_hh.r)} · p ${formatP(q.prueba_marea.senal_hh.p, t)}`
		},
		{
			name: t.calidad.agua,
			passed: q.clases_fijas.agua_permanente_ow.aprobada,
			evidence: percent(q.clases_fijas.agua_permanente_ow.acierto, t)
		},
		{
			name: t.calidad.tierra,
			passed: q.clases_fijas.tierra_firme_no_iv.aprobada,
			evidence: percent(q.clases_fijas.tierra_firme_no_iv.acierto, t)
		}
	];
	return (
		<>
			<header className="papel lab-header">
				<a href="https://mangroove.earth" aria-label={t.header.inicio}>
					<img
						src={`${import.meta.env.BASE_URL}marca/mangroove.svg`}
						alt=""
						className="lab-logo"
					/>
				</a>
				<nav aria-label={t.header.secciones} className="lab-nav">
					<a className="boton boton-fantasma" href="https://mangroove.earth/historia">
						{t.header.historia}
					</a>
					<a
						className="boton boton-fantasma bg-manglar-arena"
						href={`/laboratorio/${site.id}`}
						aria-current="page"
					>
						{t.header.explorar}
					</a>
					<a className="boton boton-fantasma" href="https://mangroove.earth/metodo">
						{t.header.metodo}
					</a>
				</nav>
				<label className="lab-site">
					<MapPin size={17} aria-hidden />
					<span className="sr-only">{t.header.estuario}</span>
					<select
						aria-label={t.header.estuario}
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
					<span>{copied ? t.header.copiado : t.header.compartir}</span>
				</button>
				<div role="group" aria-label={t.header.idioma} className="lab-idioma">
					{(['es', 'en'] as const).map(codigo => (
						<button
							key={codigo}
							type="button"
							lang={codigo}
							aria-pressed={idioma === codigo}
							onClick={() => setIdioma(codigo)}
							className={cn(
								'min-h-8 min-w-9 cursor-pointer rounded-full px-2 pt-0.5 font-titulo text-sm font-semibold uppercase transition-colors',
								idioma === codigo
									? 'bg-manglar-verde text-manglar-papel'
									: 'text-manglar-verde hover:bg-manglar-arena/60'
							)}
						>
							{codigo}
						</button>
					))}
				</div>
			</header>
			{shareError && (
				<p className="lab-share-error" role="status">
					{t.header.compartirError}
					<button onClick={() => setShareError(false)} aria-label={t.header.cerrarAviso}>
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
									{t.mapa.preparando}
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
				<div className="lab-modes papel" role="group" aria-label={t.modos.grupo}>
					<button aria-pressed={temporal} onClick={() => chooseLayer('rgb')}>
						<Music2 size={17} aria-hidden />
						{t.modos.ritmo}
					</button>
					<button
						aria-pressed={!temporal}
						onClick={() => {
							chooseLayer('if_alta');
							open('layers', true);
						}}
					>
						<Waves size={17} aria-hidden />
						{t.modos.sintonia}
					</button>
				</div>
				<aside className="panel lab-sidebar" aria-label={t.sidebar.aria}>
					<div className="lab-sidebar-title">
						<h1>{temporal ? t.modos.ritmo : t.sidebar.tituloRespuesta}</h1>
						<p>{temporal ? t.sidebar.introRitmo : t.sidebar.introRespuesta}</p>
					</div>
					<Widget
						title={t.pasada.titulo}
						icon={Music2}
						summary={`${fmt.fechaLarga(current.hora_utc, 'America/Managua')} · ${t.nivel[current.marea_nivel]}`}
						open={widgets.pass}
						onOpen={v => open('pass', v)}
					>
						<p className="lab-current-date">
							{fmt.fechaLarga(current.hora_utc, 'America/Managua')}
						</p>
						<p className="exp-caption">
							{t.pasada.horaLocal(
								fmt.hora(current.hora_utc, 'America/Managua'),
								site.nombre
							)}
						</p>
						<dl className="lab-facts">
							<div>
								<dt>{t.pasada.orbita}</dt>
								<dd>
									{current.direccion === 'asc' ? t.pasada.asc : t.pasada.desc} ·{' '}
									{t.pasada.pista(current.pista)}
								</dd>
							</div>
							<div>
								<dt>{t.pasada.mareaEstimada}</dt>
								<dd>
									{number(current.marea_m)} m · {t.nivel[current.marea_nivel]}
								</dd>
							</div>
						</dl>
						<div className="lab-orbit">
							<p id="recorrido-titulo" className="lab-orbit-title">
								{t.pasada.recorrido}
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
									{t.pasada.notaPorNota}
								</button>
								<button aria-pressed={sameOrbit} onClick={() => setSameOrbit(true)}>
									{t.pasada.mismaOrbita}
								</button>
							</div>
							<p className="exp-caption">
								{sameOrbit
									? t.pasada.ayudaMismaOrbita(current.direccion === 'asc')
									: t.pasada.ayudaNotaPorNota}
							</p>
						</div>
						<div
							className="lab-raster-switch"
							role="group"
							aria-label={t.pasada.queMuestra}
						>
							<button
								aria-pressed={layer === 'rgb'}
								onClick={() => chooseLayer('rgb')}
							>
								{t.pasada.radarRgb}
							</button>
							<button
								aria-pressed={layer === 'clases'}
								onClick={() => chooseLayer('clases')}
							>
								{t.pasada.clases}
							</button>
						</div>
						<Legend layer={layer} dataset={dataset} />
						{!temporal && <p className="exp-caption">{t.pasada.resumenCapa}</p>}
					</Widget>
					<Widget
						title={t.capas.titulo}
						icon={Layers}
						summary={t.capas.nombres[layer]}
						open={widgets.layers}
						onOpen={v => open('layers', v)}
					>
						<div
							className="lab-layer-list"
							role="group"
							aria-label={t.capas.disponibles}
						>
							{LAYERS.map(id => (
								<button
									key={id}
									aria-pressed={layer === id}
									onClick={() => chooseLayer(id)}
								>
									<span>{t.capas.nombres[id]}</span>
									{layer === id && <Check size={16} aria-hidden />}
								</button>
							))}
						</div>
					</Widget>
					<Widget
						title={t.celda.titulo}
						icon={ScanLine}
						summary={selected ? t.celda.resumenSeleccion : t.celda.resumenVacia}
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
											setCellMessage('otra');
										}}
									>
										{t.celda.limpiar}
									</button>
								</>
							) : (
								<>
									<p role="status">{t.celda[cellMessage]}</p>
									<button
										className="boton boton-contorno lab-small"
										disabled={busy}
										onClick={() => void inspect(...m.region.centro)}
									>
										{t.celda.inspeccionarCentro}
									</button>
								</>
							)}
						</div>
					</Widget>
					<Widget
						title={t.calidad.titulo}
						icon={ShieldCheck}
						summary={t.calidad.resumen(controls.filter(c => c.passed).length)}
						open={widgets.quality}
						onOpen={v => open('quality', v)}
					>
						<p className="exp-caption">{t.calidad.nota}</p>
						<ul className="lab-quality">
							{controls.map(c => (
								<li key={c.name}>
									<div>
										<strong>{c.name}</strong>
										<span className={c.passed ? 'exp-pass' : 'exp-fail'}>
											{c.passed ? t.calidad.pasa : t.calidad.noPasa}
										</span>
									</div>
									<small>{c.evidence}</small>
								</li>
							))}
						</ul>
						<h3>{t.calidad.porPista}</h3>
						<ul className="lab-quality">
							{Object.entries(q.prueba_marea.clases_por_pila).map(([track, pila]) => (
								<li key={track}>
									<div>
										<strong>
											{track.includes('asc') ? t.pasada.asc : t.pasada.desc}
										</strong>
										<span className={pila.aprobada ? 'exp-pass' : 'exp-fail'}>
											{!pila.evaluable
												? t.calidad.noEvaluable
												: pila.aprobada
													? t.calidad.pasa
													: t.calidad.noPasa}
										</span>
									</div>
									<small>
										r {number(pila.r)} · p {formatP(pila.p, t)}
									</small>
								</li>
							))}
						</ul>
						<p className="exp-caption">{t.calidad.notaP}</p>
					</Widget>
					<Widget
						title={t.marea.titulo}
						icon={Activity}
						summary={t.marea.resumen(percent(m.marea.pleamar_rel, t))}
						open={widgets.tide}
						onOpen={v => open('tide', v)}
					>
						<p>{t.marea.texto(percent(m.marea.pleamar_rel, t))}</p>
						<p className="exp-caption">{t.marea.modelo(m.marea.modelo)}</p>
						<ul className="lab-warnings">
							{q.advertencias.map((w, i) => (
								<li key={i}>{t.marea.advertencia(w)}</li>
							))}
						</ul>
					</Widget>
					<Widget
						title={t.datos.titulo}
						icon={Database}
						summary={t.datos.resumen(m.fechas.length)}
						open={widgets.data}
						onOpen={v => open('data', v)}
					>
						<p className="exp-caption">{t.datos.procedencia}</p>
						<div className="lab-downloads">
							<a
								href={assetUrl(m.datos.calidad, dataset.manifestUrl)}
								target="_blank"
								rel="noreferrer"
							>
								{t.datos.informe}
							</a>
							<a href={assetUrl(m.datos.resumen, dataset.manifestUrl)} download>
								{t.datos.resumenCsv}
							</a>
							<a href={dataset.manifestUrl} target="_blank" rel="noreferrer">
								{t.datos.manifest}
							</a>
						</div>
						<p className="exp-caption">
							{t.datos.version(site.publicacion, m.version, m.motor.version)}
						</p>
					</Widget>
					<p className="lab-experimental">{t.experimental}</p>
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
								? t.partitura.detenida
								: playing && mapPending
									? t.partitura.esperando
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
