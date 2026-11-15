import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, LocateFixed, Minus, Plus, RotateCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { env } from '@/config/env';
import {
	urlDeCapa,
	type ClaseEstanque,
	type Contexto,
	type OrdenEstanques
} from '@/features/datos/api';
import { excluidaPorLluvia, indiceDeFecha, rangoDeMarea, sinMarea } from '@/features/datos/dominio';
import type { Estanque, Fecha, Manifiesto } from '@/features/datos/esquemas';
import { EstadoSesion } from '@/features/datos/estado-sesion';
import { datos } from '@/features/datos/servicio';
import { useSesion } from '@/features/datos/sesion';
import { useIdioma } from '@/features/idioma/idioma';
import type { Caja } from '@/features/mapa/proyeccion';
import {
	Visor,
	type CapaRaster,
	type EstadoCapa,
	type Poligono,
	type VisorHandle
} from '@/features/mapa/visor';
import { FranjaManglar } from '@/features/marca/marca';
import { sonido } from '@/features/partitura/sonido';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { AppException } from '@/shared/models/app-error/app-error';
import { Spinner } from '@/shared/ui/primitives/spinner';
import { cn } from '@/shared/utils';

import {
	escribirPunto,
	escribirVista,
	leerPunto,
	leerVista,
	type Busqueda,
	type Modo
} from './busqueda';
import { Inspector, type EstadoInspector } from './inspector';
import {
	FILTRO_SOLO_DESCONEXION,
	FiltroSoloDesconexion,
	sePuedeFiltrarConectadas
} from './leyendas';
import { PanelEstanques, PanelRitmo, PanelSintonia } from './paneles';
import { Reproductor } from './reproductor';

export type CambiarBusqueda = (
	cambios: Partial<Busqueda>,
	opciones?: { reemplazar?: boolean }
) => void;

type Props = { busqueda: Busqueda; onBusqueda: CambiarBusqueda };

/** Milliseconds each pass stays on screen while playing: the beat of the score. */
const COMPAS_MS = 1300;

const COLOR_ESTANQUE = { activo: '#3987e5', abandonado: '#d95926' } as const;

/**
 * Explore view. Connects the URL with the data session and waits for a
 * manifest; the view itself only exists for a loaded version.
 */
export function Explorar({ busqueda, onBusqueda }: Props) {
	const sesion = useSesion();
	const { abrir } = sesion;
	const m = sesion.manifiesto;

	// A shared link names its region and version: ask the session for them once.
	const pedido = useRef(
		busqueda.region ? { region: busqueda.region, version: busqueda.version } : null
	);
	useEffect(() => {
		if (pedido.current) abrir(pedido.current.region, pedido.current.version);
	}, [abrir]);

	// From then on the session is the source: the URL follows it, so the link stays permanent.
	useEffect(() => {
		if (sesion.estado !== 'lista' || !m) return;
		if (pedido.current) {
			if (m.region.codigo !== pedido.current.region) return;
			pedido.current = null;
		}
		if (busqueda.region === m.region.codigo && busqueda.version === m.version) return;
		const otraRegion = busqueda.region !== undefined && busqueda.region !== m.region.codigo;
		onBusqueda(
			{
				region: m.region.codigo,
				version: m.version,
				// What was selected belongs to the previous region.
				...(otraRegion && {
					fecha: undefined,
					comparar: undefined,
					punto: undefined,
					vista: undefined,
					estanque: undefined
				})
			},
			{ reemplazar: true }
		);
	}, [sesion.estado, m, busqueda.region, busqueda.version, onBusqueda]);

	if (sesion.estado !== 'lista' || !m || !sesion.ctx) {
		return <EstadoSesion oscuro className="h-full" />;
	}
	return (
		<Vista
			key={`${m.region.codigo}@${m.version}`}
			manifiesto={m}
			ctx={sesion.ctx}
			busqueda={busqueda}
			onBusqueda={onBusqueda}
		/>
	);
}

function cajaDe(estanque: Estanque): Caja {
	const anillos =
		estanque.geometria.type === 'Polygon'
			? estanque.geometria.coordinates
			: estanque.geometria.coordinates.flat();
	const puntos = anillos.flat();
	const lons = puntos.map(p => p[0]!);
	const lats = puntos.map(p => p[1]!);
	return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

function Vista({
	manifiesto: m,
	ctx,
	busqueda,
	onBusqueda
}: Props & { manifiesto: Manifiesto; ctx: Contexto }) {
	const { t, fmt } = useIdioma();
	const escritorio = useMediaQuery('(min-width: 1024px)');
	const visor = useRef<VisorHandle>(null);
	const zona = m.region.zona_horaria;
	const fechas = m.fechas;
	const hayEstanques = Boolean(m.capas.estanques);
	const modo: Modo =
		busqueda.modo === 'estanques' && !hayEstanques ? 'ritmo' : (busqueda.modo ?? 'ritmo');

	/* ---------- passes ---------- */
	const kA = indiceDeFecha(fechas, busqueda.fecha);
	const fechaA: Fecha | undefined = fechas[kA];
	const fechaB = busqueda.comparar
		? fechas.find(f => f.id === busqueda.comparar && f.id !== fechaA?.id)
		: undefined;
	const comparando = modo === 'ritmo' && fechaB !== undefined;
	const [objetivo, setObjetivo] = useState<'A' | 'B'>('B');
	const [reproduciendo, setReproduciendo] = useState(false);
	const [sonando, setSonando] = useState<string | null>(null);
	const [posicion, setPosicion] = useState(0.5);
	const rango = useMemo(() => rangoDeMarea(fechas), [fechas]);
	const capa = reproduciendo ? 'clases' : (busqueda.capa ?? 'rgb');

	const tocar = useCallback(
		(fecha: Fecha) => {
			sonido.tocarMarea(fecha.marea_m, rango, excluidaPorLluvia(fecha, m));
			setSonando(fecha.id);
		},
		[rango, m]
	);

	const elegirPasada = (id: string) => {
		const fecha = fechas.find(f => f.id === id);
		if (!fecha) return;
		setReproduciendo(false);
		tocar(fecha);
		if (comparando && objetivo === 'B') {
			if (id !== fechaA?.id) onBusqueda({ comparar: id }, { reemplazar: true });
		} else {
			// Choosing B's pass as A would compare a pass with itself.
			onBusqueda(
				{ fecha: id, ...(id === fechaB?.id && { comparar: undefined }) },
				{ reemplazar: true }
			);
		}
	};

	const paso = (delta: 1 | -1) => {
		const destino = fechas[Math.min(fechas.length - 1, Math.max(0, kA + delta))];
		if (destino && destino.id !== fechaA?.id) elegirPasada(destino.id);
	};

	const alternarComparacion = (activar: boolean) => {
		setReproduciendo(false);
		if (!activar || !fechaA) return onBusqueda({ comparar: undefined });
		// Start against a pass with a different tide level when there is one.
		const otra =
			fechas.find(
				f =>
					f.id !== fechaA.id &&
					f.marea_nivel !== fechaA.marea_nivel &&
					f.marea_nivel !== 'desconocida'
			) ?? fechas.find(f => f.id !== fechaA.id);
		if (!otra) return;
		setObjetivo('B');
		setPosicion(0.5);
		onBusqueda({ comparar: otra.id });
	};

	// Playback: one pass per beat, in manifest order. Gaps hold no pass, so they are skipped.
	const enCurso = useRef({ kA, fechas, tocar, onBusqueda });
	useEffect(() => {
		enCurso.current = { kA, fechas, tocar, onBusqueda };
	});
	useEffect(() => {
		if (!reproduciendo) return;
		const id = window.setInterval(() => {
			const { kA: k, fechas: lista, tocar: sonar, onBusqueda: cambiar } = enCurso.current;
			const siguiente = lista[k + 1];
			if (!siguiente) return setReproduciendo(false);
			sonar(siguiente);
			cambiar({ fecha: siguiente.id }, { reemplazar: true });
		}, COMPAS_MS);
		return () => window.clearInterval(id);
	}, [reproduciendo]);

	const alternarReproduccion = () => {
		if (reproduciendo) return setReproduciendo(false);
		const inicio = kA >= fechas.length - 1 ? fechas[0] : fechaA;
		if (!inicio) return;
		tocar(inicio);
		onBusqueda({ fecha: inicio.id, comparar: undefined }, { reemplazar: true });
		setReproduciendo(true);
	};

	// Warm the cache with the next class map so the animation does not stutter.
	useEffect(() => {
		const ruta = reproduciendo ? fechas[kA + 1]?.capas.clases : undefined;
		if (ruta) new Image().src = urlDeCapa(ruta, ctx.origen);
	}, [reproduciendo, kA, fechas, ctx.origen]);

	/* ---------- layers ---------- */
	const faltaMarea = sinMarea(m);
	const solo = busqueda.solo === true && !faltaMarea;
	const filtroDisponible = useMemo(() => sePuedeFiltrarConectadas(m), [m]);
	const [reintento, setReintento] = useState(0);
	const [estados, setEstados] = useState<Record<string, EstadoCapa>>({});
	const alEstado = useCallback((id: string, estado: EstadoCapa) => {
		setEstados(previo => (previo[id] === estado ? previo : { ...previo, [id]: estado }));
	}, []);

	const { capas, sinPublicar } = useMemo(() => {
		const lista: CapaRaster[] = [];
		let falta = false;
		const agregar = (id: string, ruta: string | undefined, extra?: Partial<CapaRaster>) => {
			if (!ruta) return void (falta = true);
			lista.push({ id: `${id}#${reintento}`, url: urlDeCapa(ruta, ctx.origen), ...extra });
		};
		if (modo === 'ritmo' && fechaA) {
			agregar(`A:${fechaA.id}:${capa}`, fechaA.capas[capa]);
			if (fechaB) agregar(`B:${fechaB.id}:${capa}`, fechaB.capas[capa], { lado: 'derecha' });
		} else if (modo === 'sintonia') {
			const tipo = faltaMarea ? 'if' : solo ? 'desconexion' : 'if_alta';
			agregar(`conectividad:${tipo}`, m.capas[tipo], {
				filtro: solo && filtroDisponible ? `url(#${FILTRO_SOLO_DESCONEXION})` : undefined
			});
		}
		return { capas: lista, sinPublicar: falta };
	}, [
		modo,
		fechaA,
		fechaB,
		capa,
		faltaMarea,
		solo,
		filtroDisponible,
		m.capas,
		ctx.origen,
		reintento
	]);

	const fallo = capas.some(c => estados[c.id] === 'error');
	const cargandoCapa = !fallo && capas.some(c => (estados[c.id] ?? 'cargando') === 'cargando');

	/* ---------- inspected cell ---------- */
	const punto = leerPunto(busqueda.punto);
	const celda = useQuery({
		...datos.celda(ctx, punto?.lon ?? 0, punto?.lat ?? 0),
		enabled: punto !== null && ctx.origen === 'api'
	});
	const fueraDeGrilla =
		celda.error instanceof AppException && celda.error.error.kind === 'notFound';
	// A point outside the grid has no cell: say so and do not open the panel.
	const avisoFuera = punto !== null && fueraDeGrilla;

	const estadoInspector: EstadoInspector | null =
		!punto || avisoFuera
			? null
			: ctx.origen === 'respaldo'
				? { tipo: 'sin-conexion' }
				: celda.data
					? { tipo: 'lista', celda: celda.data }
					: celda.isError
						? { tipo: 'error', onReintentar: () => void celda.refetch() }
						: { tipo: 'cargando' };

	const seleccion =
		punto && !avisoFuera
			? {
					lon: celda.data?.centroide[0] ?? punto.lon,
					lat: celda.data?.centroide[1] ?? punto.lat,
					celdaM: m.region.grilla.celda_m
				}
			: null;

	/* ---------- ponds ---------- */
	const clase: ClaseEstanque = busqueda.clase ?? '';
	const orden: OrdenEstanques = busqueda.orden ?? 'puntaje';
	const estanques = useQuery({
		...datos.estanques(ctx, clase, orden),
		enabled: modo === 'estanques' && hayEstanques
	});
	const poligonos = useMemo<Poligono[] | undefined>(() => {
		if (modo !== 'estanques' || !estanques.data) return undefined;
		return estanques.data.map(e => ({
			id: e.codigo,
			anillos:
				e.geometria.type === 'Polygon'
					? e.geometria.coordinates
					: e.geometria.coordinates.flat(),
			color: e.activo ? COLOR_ESTANQUE.activo : COLOR_ESTANQUE.abandonado,
			destacado: e.codigo === busqueda.estanque,
			etiqueta: `${e.codigo}: ${e.activo ? t.estanques.activo : t.estanques.abandonado}`
		}));
	}, [modo, estanques.data, busqueda.estanque, t]);

	const elegirEstanque = (codigo: string) => {
		onBusqueda({ estanque: codigo }, { reemplazar: true });
		const estanque = estanques.data?.find(e => e.codigo === codigo);
		if (estanque)
			visor.current?.volarA(cajaDe(estanque), {
				arriba: 140,
				abajo: 140,
				izquierda: escritorio ? 400 : 60,
				derecha: 140
			});
	};

	/* ---------- map ---------- */
	const [vistaInicial] = useState(() =>
		busqueda.region === undefined || busqueda.region === m.region.codigo
			? (leerVista(busqueda.vista) ?? undefined)
			: undefined
	);
	const inspectorAbierto = estadoInspector !== null;
	const conPartitura = modo !== 'estanques';
	const margen = useMemo(
		() =>
			escritorio
				? {
						izquierda: 348,
						arriba: 84,
						derecha: inspectorAbierto ? 388 : 84,
						abajo: conPartitura ? 212 : 40
					}
				: { izquierda: 16, arriba: 72, derecha: 16, abajo: 24 },
		[escritorio, inspectorAbierto, conPartitura]
	);
	const alMoverVista = useCallback(
		(v: { lon: number; lat: number; zoom: number }) =>
			onBusqueda({ vista: escribirVista(v) }, { reemplazar: true }),
		[onBusqueda]
	);
	const limites = m.limites ?? m.region.bbox;

	const nombreCapa =
		modo === 'ritmo'
			? capa === 'rgb'
				? t.ritmo.rgb
				: t.ritmo.clases
			: modo === 'sintonia'
				? faltaMarea
					? t.campos.ifTotal
					: solo
						? t.sintonia.solo
						: t.campos.ifAlta
				: t.estanques.titulo;
	const rotulo = (fecha: Fecha) =>
		`${fmt.fechaLarga(fecha.fecha_hora, zona)}, ${t.orbita(fecha.orbita)}${
			fecha.marea_nivel === 'desconocida'
				? ''
				: `, ${t.pasada.mareaNivel(t.nivelMarea[fecha.marea_nivel])}`
		}`;
	const descripcion =
		modo === 'ritmo' && fechaA
			? comparando && fechaB
				? t.mapa.descripcionComparar(nombreCapa, rotulo(fechaA), rotulo(fechaB))
				: t.mapa.descripcionPasada(nombreCapa, rotulo(fechaA))
			: t.mapa.descripcionCapa(nombreCapa, m.region.nombre);

	/* ---------- pieces shared by the desktop and mobile layouts ---------- */
	const modos = (
		<nav
			aria-label={t.modos.etiqueta}
			className="papel pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-full border border-manglar-olivo/50 p-1 shadow-md"
		>
			{(
				['ritmo', 'sintonia', ...(hayEstanques ? (['estanques'] as const) : [])] as Modo[]
			).map(opcion => (
				<button
					key={opcion}
					type="button"
					aria-current={modo === opcion ? 'page' : undefined}
					onClick={() => {
						setReproduciendo(false);
						onBusqueda({ modo: opcion === 'ritmo' ? undefined : opcion });
					}}
					className={cn(
						'min-h-10 shrink-0 cursor-pointer rounded-full px-4 pt-0.5 font-titulo whitespace-nowrap transition-colors',
						modo === opcion
							? 'bg-manglar-verde text-manglar-papel'
							: 'hover:bg-manglar-arena/70'
					)}
				>
					{t.modos[opcion]}
				</button>
			))}
		</nav>
	);

	const controles = (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				className="control-mapa"
				aria-label={t.mapa.acercar}
				onClick={() => visor.current?.acercar()}
			>
				<Plus className="size-5" aria-hidden />
			</button>
			<button
				type="button"
				className="control-mapa"
				aria-label={t.mapa.alejar}
				onClick={() => visor.current?.alejar()}
			>
				<Minus className="size-5" aria-hidden />
			</button>
			<button
				type="button"
				className="control-mapa"
				aria-label={t.mapa.encajar}
				title={t.mapa.encajar}
				onClick={() => visor.current?.encajar()}
			>
				<LocateFixed className="size-5" aria-hidden />
			</button>
		</div>
	);

	const avisos = (
		<>
			{comparando && fechaA && fechaB && (
				<div className="flex w-full justify-between gap-2">
					<Rotulo letra="A" texto={rotulo(fechaA)} />
					<Rotulo letra="B" texto={rotulo(fechaB)} />
				</div>
			)}
			{ctx.origen === 'respaldo' && (
				<AvisoMapa
					icono={<WifiOff className="size-4" aria-hidden />}
					titulo={t.mapa.sinConexion}
				>
					{t.mapa.sinConexionDetalle}
				</AvisoMapa>
			)}
			{sinPublicar && (
				<AvisoMapa titulo={t.mapa.capaSinPublicar}>
					{t.mapa.capaSinPublicarDetalle}
				</AvisoMapa>
			)}
			{fallo && (
				<AvisoMapa
					alerta
					titulo={t.mapa.capaFallo}
					acciones={
						<>
							<button
								type="button"
								className="boton boton-primario min-h-10 px-4"
								onClick={() => setReintento(r => r + 1)}
							>
								<RotateCw className="size-4" aria-hidden />
								{t.estado.reintentar}
							</button>
							{modo === 'ritmo' && fechas.length > 1 && (
								<button
									type="button"
									className="boton boton-contorno min-h-10 px-4"
									onClick={() => paso(kA > 0 ? -1 : 1)}
								>
									{t.mapa.otraPasada}
								</button>
							)}
						</>
					}
				>
					{t.mapa.capaFalloDetalle}
				</AvisoMapa>
			)}
			{avisoFuera && (
				<AvisoMapa titulo={t.mapa.fueraDeGrilla}>{t.mapa.fueraDeGrillaDetalle}</AvisoMapa>
			)}
			{cargandoCapa && (
				<p
					role="status"
					className="papel pointer-events-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-sm shadow-md"
				>
					<Spinner className="size-4" />
					{t.mapa.cargandoCapa}
				</p>
			)}
		</>
	);

	const panel =
		modo === 'ritmo' ? (
			<PanelRitmo
				manifiesto={m}
				fecha={fechaA}
				fechaB={fechaB}
				capa={capa}
				onCapa={nueva => {
					setReproduciendo(false);
					onBusqueda({ capa: nueva === 'rgb' ? undefined : nueva });
				}}
				comparando={comparando}
				objetivo={objetivo}
				onObjetivo={setObjetivo}
				onComparar={alternarComparacion}
				reproduciendo={reproduciendo}
			/>
		) : modo === 'sintonia' ? (
			<PanelSintonia
				manifiesto={m}
				ctx={ctx}
				solo={solo}
				onSolo={valor => onBusqueda({ solo: valor || undefined })}
				filtroDisponible={filtroDisponible}
			/>
		) : (
			<PanelEstanques
				estanques={estanques.data}
				estado={estanques.isPending ? 'cargando' : estanques.isError ? 'error' : 'lista'}
				clase={clase}
				orden={orden}
				onClase={c => onBusqueda({ clase: c === '' ? undefined : c })}
				onOrden={o => onBusqueda({ orden: o === 'puntaje' ? undefined : o })}
				seleccion={busqueda.estanque}
				onSeleccion={elegirEstanque}
			/>
		);

	const reproductor = conPartitura && (
		<Reproductor
			manifiesto={m}
			seleccion={fechaA?.id}
			onSeleccion={elegirPasada}
			comparacion={comparando ? fechaB?.id : null}
			modo={modo === 'sintonia' ? 'conectividad' : 'pasada'}
			sonando={sonando}
			transporte={
				modo === 'ritmo'
					? { reproduciendo, onReproducir: alternarReproduccion, onPaso: paso }
					: undefined
			}
			nota={
				modo === 'sintonia'
					? t.sintonia.partitura(
							fechas.filter(f => f.usada_en_if_alta).length,
							fechas.length
						)
					: comparando
						? t.comparar.partitura(objetivo)
						: undefined
			}
		/>
	);

	const inspector = estadoInspector && (
		<Inspector
			estado={estadoInspector}
			manifiesto={m}
			onCerrar={() => onBusqueda({ punto: undefined })}
		/>
	);

	const mapa = (
		<Visor
			ref={visor}
			className="absolute inset-0"
			limites={limites}
			limitesCapas={m.limites}
			capas={capas}
			teselas={env.tilesUrl || undefined}
			margen={margen}
			vistaInicial={vistaInicial}
			comparar={comparando ? { posicion, onPosicion: setPosicion } : undefined}
			seleccion={seleccion}
			poligonos={poligonos}
			onPoligono={elegirEstanque}
			onPunto={(lon, lat) => onBusqueda({ punto: escribirPunto(lon, lat) })}
			onVista={alMoverVista}
			onEstadoCapa={alEstado}
			textos={t.mapa.visor}
			descripcion={descripcion}
			atribucion={env.tilesUrl ? t.mapa.atribucion : t.mapa.atribucionSinBase}
		/>
	);

	if (escritorio) {
		const derecha = inspectorAbierto ? 'right-[24.25rem]' : 'right-3';
		return (
			<div className="relative h-full overflow-hidden">
				<FiltroSoloDesconexion />
				{mapa}
				<aside
					aria-label={t.modos[modo]}
					className="panel absolute top-3 bottom-3 left-3 z-20 flex w-[20.5rem] flex-col gap-4 overflow-y-auto p-5"
				>
					{panel}
					<FranjaManglar className="-mx-5 -mb-5 min-h-0" />
				</aside>
				<div
					className={cn(
						'pointer-events-none absolute top-3 left-[22.25rem] z-10 flex flex-col items-center gap-2 [&>*]:pointer-events-auto',
						inspectorAbierto ? 'right-[28.5rem]' : 'right-[4.75rem]'
					)}
				>
					{modos}
					{avisos}
				</div>
				<div className={cn('absolute top-3 z-10', derecha)}>{controles}</div>
				{reproductor && (
					<div className={cn('absolute bottom-3 left-[22.25rem] z-10', derecha)}>
						{reproductor}
					</div>
				)}
				{inspector && (
					<div className="panel aparecer absolute top-3 right-3 bottom-3 z-20 w-[23rem] overflow-y-auto p-5">
						{inspector}
					</div>
				)}
			</div>
		);
	}

	return (
		<Movil
			mapa={mapa}
			modos={modos}
			controles={controles}
			avisos={avisos}
			inspector={inspector}
			reproductor={reproductor}
			panel={panel}
		/>
	);
}

/** Phone and tablet: the map on top, a sheet below that never hides it completely. */
function Movil({
	mapa,
	modos,
	controles,
	avisos,
	inspector,
	reproductor,
	panel
}: Record<
	'mapa' | 'modos' | 'controles' | 'avisos' | 'inspector' | 'reproductor' | 'panel',
	ReactNode
>) {
	const { t } = useIdioma();
	const [amplia, setAmplia] = useState(false);
	return (
		<div className="flex h-full flex-col overflow-hidden">
			<FiltroSoloDesconexion />
			<div className="relative min-h-0 flex-1">
				{mapa}
				<div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex flex-col items-start gap-2 pr-14 [&>*]:pointer-events-auto">
					{modos}
					{avisos}
				</div>
				<div className="absolute top-2 right-2 z-10">{controles}</div>
			</div>
			<section
				className={cn(
					'papel relative z-20 -mt-4 flex shrink-0 flex-col rounded-t-3xl border-t-2 border-manglar-olivo transition-[height] duration-300',
					amplia || inspector ? 'h-[62%]' : 'h-[44%]'
				)}
			>
				{!inspector && (
					<button
						type="button"
						aria-expanded={amplia}
						onClick={() => setAmplia(a => !a)}
						className="etiqueta flex min-h-9 shrink-0 cursor-pointer items-center justify-center gap-1"
					>
						{amplia ? (
							<ChevronDown className="size-4" aria-hidden />
						) : (
							<ChevronUp className="size-4" aria-hidden />
						)}
						{amplia ? t.mapa.verMenos : t.mapa.verMas}
					</button>
				)}
				<div
					className={cn(
						'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6',
						inspector && 'pt-4'
					)}
				>
					{inspector ?? (
						<>
							{reproductor}
							{panel}
						</>
					)}
				</div>
			</section>
		</div>
	);
}

function Rotulo({ letra, texto }: { letra: 'A' | 'B'; texto: string }) {
	return (
		<p className="max-w-[48%] rounded-full bg-manglar-verde px-3 py-1.5 text-sm text-manglar-papel shadow-md">
			<strong className="mr-1.5 text-manglar-arena">{letra}</strong>
			{texto}
		</p>
	);
}

function AvisoMapa({
	titulo,
	children,
	acciones,
	icono,
	alerta
}: {
	titulo: string;
	children: ReactNode;
	acciones?: ReactNode;
	icono?: ReactNode;
	alerta?: boolean;
}) {
	return (
		<div
			role={alerta ? 'alert' : 'status'}
			className="papel aparecer w-full max-w-md space-y-1 rounded-2xl border border-l-[6px] border-manglar-olivo/50 border-l-manglar-olivo px-4 py-3 shadow-md"
		>
			<p className="flex items-center gap-2 font-semibold">
				{icono}
				{titulo}
			</p>
			<p className="text-sm leading-snug">{children}</p>
			{acciones && <div className="flex flex-wrap gap-2 pt-2">{acciones}</div>}
		</div>
	);
}
