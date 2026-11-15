import { ChevronLeft, ChevronRight, SeparatorVertical } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	type Ref
} from 'react';

import { cn } from '@/shared/utils';

import {
	acotar,
	aLonLat,
	aPantalla,
	barraDeEscala,
	cajaAPantalla,
	encajar,
	latAMundo,
	lonAMundo,
	metrosPorPixel,
	mundoALat,
	mundoALon,
	teselasVisibles,
	urlDeTesela,
	zoomEn,
	type Caja,
	type Tamano,
	type Vista
} from './proyeccion';

/**
 * Map viewer of Mangroove.
 *
 * It works like the team's reference viewer (pan, wheel zoom, split view with a
 * draggable divider, click to inspect a 1 ha cell), with two differences: the
 * layers are the georeferenced PNGs the API publishes, and a reference image
 * sits under them. It needs no map library: a layer is a rectangle in Web
 * Mercator (see `proyeccion.ts`).
 *
 * The viewer never paints data itself. It only places what it is given.
 */

export type EstadoCapa = 'cargando' | 'lista' | 'error';

export type CapaRaster = {
	id: string;
	url: string;
	/** In split view, layers marked `derecha` are only visible right of the divider. */
	lado?: 'derecha';
	opacidad?: number;
	/** CSS `filter` applied to the image, e.g. to hide one legend class. */
	filtro?: string;
};

export type Poligono = {
	id: string;
	/** Rings as `[lon, lat]` positions. */
	anillos: number[][][];
	color: string;
	destacado?: boolean;
	etiqueta: string;
};

export type Margen = { arriba?: number; derecha?: number; abajo?: number; izquierda?: number };

export type VisorHandle = {
	acercar: () => void;
	alejar: () => void;
	encajar: () => void;
	/** Moves the view to a box; animated unless the visitor prefers reduced motion. */
	volarA: (caja: Caja, margen?: Margen) => void;
	irA: (lon: number, lat: number, zoom?: number) => void;
};

export type TextosVisor = {
	mapa: string;
	instrucciones: string;
	divisor: string;
	moverIzquierda: string;
	moverDerecha: string;
};

type Props = {
	ref?: Ref<VisorHandle>;
	/** Extent the view fits on load and on "encajar". */
	limites: Caja;
	/** Corners shared by every PNG layer of the version; `null` hides the layers. */
	limitesCapas: Caja | null;
	capas: CapaRaster[];
	teselas?: string;
	/** Space taken by panels floating over the map, so "fit" keeps the data visible. */
	margen?: Margen;
	vistaInicial?: { lon: number; lat: number; zoom: number };
	comparar?: { posicion: number; onPosicion: (posicion: number) => void };
	seleccion?: { lon: number; lat: number; celdaM: number } | null;
	poligonos?: Poligono[];
	onPoligono?: (id: string) => void;
	onPunto?: (lon: number, lat: number) => void;
	onVista?: (vista: { lon: number; lat: number; zoom: number }) => void;
	onEstadoCapa?: (id: string, estado: EstadoCapa) => void;
	textos: TextosVisor;
	/** Text alternative of what the map shows right now. */
	descripcion: string;
	atribucion?: ReactNode;
	interactivo?: boolean;
	className?: string;
	children?: ReactNode;
};

const reducirMovimiento = () =>
	typeof window !== 'undefined' &&
	window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function Visor({
	ref,
	limites,
	limitesCapas,
	capas,
	teselas,
	margen,
	vistaInicial,
	comparar,
	seleccion,
	poligonos,
	onPoligono,
	onPunto,
	onVista,
	onEstadoCapa,
	textos,
	descripcion,
	atribucion,
	interactivo = true,
	className,
	children
}: Props) {
	const contenedor = useRef<HTMLDivElement>(null);
	const [tamano, setTamano] = useState<Tamano | null>(null);
	const [vista, setVista] = useState<Vista | null>(null);
	const [arrastrando, setArrastrando] = useState(false);

	// Latest values for handlers that outlive a render (pointer capture, rAF, wheel).
	const actual = useRef({ vista, tamano, limites, margen, onPunto, onVista });
	useEffect(() => {
		actual.current = { vista, tamano, limites, margen, onPunto, onVista };
	});

	useEffect(() => {
		const el = contenedor.current;
		if (!el) return;
		const observer = new ResizeObserver(([entrada]) => {
			if (!entrada) return;
			const { width, height } = entrada.contentRect;
			if (width > 0 && height > 0) setTamano({ ancho: width, alto: height });
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// First view: the shared link's view if there is one, otherwise the whole region.
	const iniciada = useRef(false);
	useEffect(() => {
		if (iniciada.current || !tamano) return;
		iniciada.current = true;
		setVista(
			vistaInicial
				? {
						x: lonAMundo(vistaInicial.lon),
						y: latAMundo(vistaInicial.lat),
						zoom: vistaInicial.zoom
					}
				: encajar(limites, tamano, margen)
		);
	}, [tamano, vistaInicial, limites, margen]);

	// Tell the parent where the view ended up, once the movement settles.
	useEffect(() => {
		if (!vista) return;
		const id = window.setTimeout(() => {
			actual.current.onVista?.({
				lon: mundoALon(vista.x),
				lat: mundoALat(vista.y),
				zoom: vista.zoom
			});
		}, 350);
		return () => window.clearTimeout(id);
	}, [vista]);

	const animacion = useRef(0);
	const volar = useCallback((destino: Vista) => {
		window.cancelAnimationFrame(animacion.current);
		const origen = actual.current.vista;
		if (!origen || reducirMovimiento()) {
			setVista(destino);
			return;
		}
		const inicio = performance.now();
		const duracion = 900;
		const paso = (ahora: number) => {
			const p = Math.min(1, (ahora - inicio) / duracion);
			const s = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
			setVista({
				x: origen.x + (destino.x - origen.x) * s,
				y: origen.y + (destino.y - origen.y) * s,
				zoom: origen.zoom + (destino.zoom - origen.zoom) * s
			});
			if (p < 1) animacion.current = window.requestAnimationFrame(paso);
		};
		animacion.current = window.requestAnimationFrame(paso);
	}, []);
	useEffect(() => () => window.cancelAnimationFrame(animacion.current), []);

	const zoomCentral = useCallback(
		(delta: number) => {
			const { vista: v, tamano: t } = actual.current;
			if (v && t) volar(zoomEn(v, delta, t.ancho / 2, t.alto / 2, t));
		},
		[volar]
	);

	useImperativeHandle(
		ref,
		() => ({
			acercar: () => zoomCentral(1),
			alejar: () => zoomCentral(-1),
			encajar: () => {
				const { tamano: t, limites: l, margen: m } = actual.current;
				if (t) volar(encajar(l, t, m));
			},
			volarA: (caja, m) => {
				const { tamano: t, margen: base } = actual.current;
				if (t) volar(encajar(caja, t, m ?? base));
			},
			irA: (lon, lat, zoom) => {
				const v = actual.current.vista;
				if (v) volar({ x: lonAMundo(lon), y: latAMundo(lat), zoom: zoom ?? v.zoom });
			}
		}),
		[volar, zoomCentral]
	);

	/* ---------- pointer: pan, pinch, click ---------- */
	const punteros = useRef(new Map<number, { x: number; y: number }>());
	const gesto = useRef<{
		x: number;
		y: number;
		vista: Vista;
		movido: boolean;
		distancia: number;
	} | null>(null);

	const posicion = (e: { clientX: number; clientY: number }) => {
		const caja = contenedor.current!.getBoundingClientRect();
		return { x: e.clientX - caja.left, y: e.clientY - caja.top };
	};

	const alPresionar = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!interactivo || !vista || e.button > 0) return;
		window.cancelAnimationFrame(animacion.current);
		e.currentTarget.setPointerCapture(e.pointerId);
		punteros.current.set(e.pointerId, posicion(e));
		const puntos = [...punteros.current.values()];
		const [a, b] = puntos;
		gesto.current = {
			x: a!.x,
			y: a!.y,
			vista,
			movido: puntos.length > 1,
			distancia: b ? Math.hypot(b.x - a!.x, b.y - a!.y) : 0
		};
	};

	const alMover = (e: ReactPointerEvent<HTMLDivElement>) => {
		const g = gesto.current;
		if (!g || !tamano || !punteros.current.has(e.pointerId)) return;
		punteros.current.set(e.pointerId, posicion(e));
		const puntos = [...punteros.current.values()];
		const [a, b] = puntos;
		if (b && g.distancia > 0) {
			// Pinch: zoom around the midpoint of the two fingers.
			const delta = Math.log2(Math.hypot(b.x - a!.x, b.y - a!.y) / g.distancia);
			setVista(zoomEn(g.vista, delta, (a!.x + b.x) / 2, (a!.y + b.y) / 2, tamano));
			return;
		}
		const dx = a!.x - g.x;
		const dy = a!.y - g.y;
		if (!g.movido && Math.abs(dx) + Math.abs(dy) < 5) return;
		g.movido = true;
		setArrastrando(true);
		const e2 = 256 * 2 ** g.vista.zoom;
		setVista({ ...g.vista, x: g.vista.x - dx / e2, y: acotar(g.vista.y - dy / e2, 0, 1) });
	};

	const alSoltar = (e: ReactPointerEvent<HTMLDivElement>) => {
		const g = gesto.current;
		const habia = punteros.current.delete(e.pointerId);
		if (!g || !habia) return;
		if (punteros.current.size > 0) {
			// One finger left after a pinch: restart the pan from here, never a click.
			const [a] = [...punteros.current.values()];
			if (actual.current.vista) {
				gesto.current = {
					x: a!.x,
					y: a!.y,
					vista: actual.current.vista,
					movido: true,
					distancia: 0
				};
			}
			return;
		}
		gesto.current = null;
		setArrastrando(false);
		if (!g.movido && e.type === 'pointerup' && vista && tamano) {
			const p = posicion(e);
			const { lon, lat } = aLonLat(p.x, p.y, vista, tamano);
			onPunto?.(lon, lat);
		}
	};

	// Wheel zoom needs a non-passive listener to keep the page from scrolling.
	useEffect(() => {
		const el = contenedor.current;
		if (!el || !interactivo) return;
		const alGirar = (e: WheelEvent) => {
			const { vista: v, tamano: t } = actual.current;
			if (!v || !t) return;
			e.preventDefault();
			window.cancelAnimationFrame(animacion.current);
			const caja = el.getBoundingClientRect();
			const delta = acotar(-e.deltaY * (e.deltaMode === 1 ? 0.08 : 0.0025), -1, 1);
			setVista(zoomEn(v, delta, e.clientX - caja.left, e.clientY - caja.top, t));
		};
		el.addEventListener('wheel', alGirar, { passive: false });
		return () => el.removeEventListener('wheel', alGirar);
	}, [interactivo]);

	const alTeclear = (e: ReactKeyboardEvent<HTMLDivElement>) => {
		if (!interactivo || !vista || !tamano || e.target !== e.currentTarget) return;
		const paso = 80 / (256 * 2 ** vista.zoom);
		const mover = (dx: number, dy: number) =>
			setVista({ ...vista, x: vista.x + dx * paso, y: acotar(vista.y + dy * paso, 0, 1) });
		switch (e.key) {
			case 'ArrowLeft':
				mover(-1, 0);
				break;
			case 'ArrowRight':
				mover(1, 0);
				break;
			case 'ArrowUp':
				mover(0, -1);
				break;
			case 'ArrowDown':
				mover(0, 1);
				break;
			case '+':
			case '=':
				zoomCentral(1);
				break;
			case '-':
				zoomCentral(-1);
				break;
			case '0':
				volar(encajar(limites, tamano, margen));
				break;
			case 'Enter':
				// Inspect the cell at the centre of the view: the keyboard path to the inspector.
				onPunto?.(mundoALon(vista.x), mundoALat(vista.y));
				break;
			default:
				return;
		}
		e.preventDefault();
	};

	const listo = vista !== null && tamano !== null;
	const teselasActuales = useMemo(
		() => (listo && teselas ? teselasVisibles(vista, tamano) : []),
		[listo, teselas, vista, tamano]
	);
	const rectCapas = listo && limitesCapas ? cajaAPantalla(limitesCapas, vista, tamano) : null;
	const latitud = vista ? mundoALat(vista.y) : 0;
	const barra = vista ? barraDeEscala(latitud, vista.zoom) : null;
	// Past the native resolution of the 1 ha grid, show crisp cells instead of a blur.
	const pixelada = vista ? metrosPorPixel(latitud, vista.zoom) < 60 : false;
	const xDivisor = comparar && tamano ? comparar.posicion * tamano.ancho : null;

	const izquierda = capas.filter(c => c.lado !== 'derecha');
	const derecha = capas.filter(c => c.lado === 'derecha');

	return (
		<div
			ref={contenedor}
			role="application"
			aria-label={textos.mapa}
			aria-roledescription={textos.mapa}
			aria-describedby="visor-instrucciones visor-descripcion"
			tabIndex={interactivo ? 0 : -1}
			onPointerDown={alPresionar}
			onPointerMove={alMover}
			onPointerUp={alSoltar}
			onPointerCancel={alSoltar}
			onKeyDown={alTeclear}
			className={cn(
				'sobre-oscuro relative touch-none overflow-hidden bg-manglar-noche select-none',
				interactivo && (arrastrando ? 'cursor-grabbing' : 'cursor-crosshair'),
				className
			)}
		>
			<p id="visor-instrucciones" className="sr-only">
				{textos.instrucciones}
			</p>
			<p id="visor-descripcion" className="sr-only" aria-live="polite">
				{descripcion}
			</p>

			{/* Reference imagery: context, not a Mangroove result. */}
			<div aria-hidden className="pointer-events-none absolute inset-0">
				{teselas &&
					teselasActuales.map(tesela => (
						<img
							key={`${tesela.z}/${tesela.x}/${tesela.y}`}
							src={urlDeTesela(teselas, tesela)}
							alt=""
							draggable={false}
							loading="eager"
							decoding="async"
							className="absolute max-w-none"
							style={{
								left: Math.floor(tesela.izquierda),
								top: Math.floor(tesela.arriba),
								width: Math.ceil(tesela.lado) + 1,
								height: Math.ceil(tesela.lado) + 1
							}}
						/>
					))}
			</div>

			{rectCapas && (
				<>
					<div aria-hidden className="pointer-events-none absolute inset-0">
						{izquierda.map(capa => (
							<Raster
								key={capa.id}
								capa={capa}
								rect={rectCapas}
								pixelada={pixelada}
								onEstado={onEstadoCapa}
							/>
						))}
					</div>
					{xDivisor !== null && (
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0"
							style={{ clipPath: `inset(0 0 0 ${xDivisor}px)` }}
						>
							{/* Hide the left pass under the right one, so the two never blend. */}
							<div className="absolute inset-0 bg-manglar-noche" />
							{teselas &&
								teselasActuales.map(tesela => (
									<img
										key={`${tesela.z}/${tesela.x}/${tesela.y}`}
										src={urlDeTesela(teselas, tesela)}
										alt=""
										draggable={false}
										className="absolute max-w-none"
										style={{
											left: Math.floor(tesela.izquierda),
											top: Math.floor(tesela.arriba),
											width: Math.ceil(tesela.lado) + 1,
											height: Math.ceil(tesela.lado) + 1
										}}
									/>
								))}
							{derecha.map(capa => (
								<Raster
									key={capa.id}
									capa={capa}
									rect={rectCapas}
									pixelada={pixelada}
									onEstado={onEstadoCapa}
								/>
							))}
						</div>
					)}
				</>
			)}

			{listo && poligonos && poligonos.length > 0 && (
				<svg className="pointer-events-none absolute inset-0 size-full" role="group">
					{poligonos.map(poligono => (
						<path
							key={poligono.id}
							d={poligono.anillos
								.map(
									anillo =>
										anillo
											.map((p, i) => {
												const { x, y } = aPantalla(
													p[0]!,
													p[1]!,
													vista,
													tamano
												);
												return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
											})
											.join('') + 'Z'
								)
								.join('')}
							fill={poligono.color}
							fillOpacity={poligono.destacado ? 0.75 : 0.4}
							stroke={poligono.destacado ? '#f7f1e3' : poligono.color}
							strokeWidth={poligono.destacado ? 3 : 1.25}
							fillRule="evenodd"
							className={cn(onPoligono && 'pointer-events-auto cursor-pointer')}
							// Stop the map from treating the tap as a cell click.
							onPointerDown={onPoligono ? e => e.stopPropagation() : undefined}
							onClick={onPoligono ? () => onPoligono(poligono.id) : undefined}
						>
							<title>{poligono.etiqueta}</title>
						</path>
					))}
				</svg>
			)}

			{listo && seleccion && <Marcador seleccion={seleccion} vista={vista} tamano={tamano} />}

			{comparar && xDivisor !== null && tamano && (
				<Divisor
					x={xDivisor}
					ancho={tamano.ancho}
					posicion={comparar.posicion}
					onPosicion={comparar.onPosicion}
					textos={textos}
				/>
			)}

			{barra && (
				<div className="pointer-events-none absolute bottom-2 left-3 text-xs text-manglar-papel [text-shadow:0_1px_2px_rgb(0_0_0/0.8)]">
					<div
						className="h-1.5 border-x border-b border-manglar-papel"
						style={{ width: barra.px }}
					/>
					{barra.metros >= 1000 ? `${barra.metros / 1000} km` : `${barra.metros} m`}
				</div>
			)}
			{atribucion && (
				<p className="pointer-events-none absolute right-3 bottom-2 max-w-[70%] text-right text-xs text-manglar-papel [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
					{atribucion}
				</p>
			)}

			{children}
		</div>
	);
}

type Rect = { izquierda: number; arriba: number; ancho: number; alto: number };

/**
 * One PNG layer. The new image is decoded off-screen and swapped in when it is
 * ready, so changing the pass never flashes an empty map. If it fails, the
 * layer is removed: an old pass must never stay under a new date.
 */
function Raster({
	capa,
	rect,
	pixelada,
	onEstado
}: {
	capa: CapaRaster;
	rect: Rect;
	pixelada: boolean;
	onEstado?: (id: string, estado: EstadoCapa) => void;
}) {
	const [mostrada, setMostrada] = useState<string | null>(null);
	const avisar = useRef(onEstado);
	useEffect(() => {
		avisar.current = onEstado;
	});

	useEffect(() => {
		let vigente = true;
		avisar.current?.(capa.id, 'cargando');
		const imagen = new Image();
		imagen.onload = () => {
			if (!vigente) return;
			setMostrada(capa.url);
			avisar.current?.(capa.id, 'lista');
		};
		imagen.onerror = () => {
			if (!vigente) return;
			setMostrada(null);
			avisar.current?.(capa.id, 'error');
		};
		imagen.src = capa.url;
		return () => {
			vigente = false;
		};
	}, [capa.id, capa.url]);

	if (!mostrada) return null;
	return (
		<img
			src={mostrada}
			alt=""
			draggable={false}
			className="absolute max-w-none"
			style={{
				left: rect.izquierda,
				top: rect.arriba,
				width: rect.ancho,
				height: rect.alto,
				opacity: capa.opacidad ?? 1,
				filter: capa.filtro,
				imageRendering: pixelada ? 'pixelated' : 'auto'
			}}
		/>
	);
}

function Marcador({
	seleccion,
	vista,
	tamano
}: {
	seleccion: { lon: number; lat: number; celdaM: number };
	vista: Vista;
	tamano: Tamano;
}) {
	const centro = aPantalla(seleccion.lon, seleccion.lat, vista, tamano);
	const lado = Math.max(14, seleccion.celdaM / metrosPorPixel(seleccion.lat, vista.zoom));
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute rounded-[3px] border-[3px] border-white shadow-[0_0_0_2px_#0d3b16,0_0_12px_rgb(0_0_0/0.6)]"
			style={{
				left: centro.x - lado / 2,
				top: centro.y - lado / 2,
				width: lado,
				height: lado
			}}
		/>
	);
}

/** Split-view divider: drag it, or use the arrow keys or the two buttons. */
function Divisor({
	x,
	ancho,
	posicion,
	onPosicion,
	textos
}: {
	x: number;
	ancho: number;
	posicion: number;
	onPosicion: (posicion: number) => void;
	textos: TextosVisor;
}) {
	const mover = (p: number) => onPosicion(acotar(p, 0.04, 0.96));
	const arrastre = useRef(false);
	const raiz = useRef<HTMLDivElement>(null);
	const detener = (e: { stopPropagation: () => void }) => e.stopPropagation();

	return (
		<div
			ref={raiz}
			className="absolute inset-y-0 z-10"
			style={{ left: x }}
			onPointerDown={detener}
			onPointerUp={detener}
		>
			<div className="pointer-events-none absolute inset-y-0 -left-[1.5px] w-[3px] bg-manglar-arena shadow-[0_0_6px_rgb(0_0_0/0.6)]" />
			<div className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5">
				<button
					type="button"
					className="control-mapa size-9"
					aria-label={textos.moverIzquierda}
					onClick={() => mover(posicion - 0.05)}
				>
					<ChevronLeft className="size-4" />
				</button>
				<div
					role="slider"
					tabIndex={0}
					aria-label={textos.divisor}
					aria-orientation="horizontal"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(posicion * 100)}
					className="flex size-11 cursor-ew-resize touch-none items-center justify-center rounded-full bg-manglar-arena text-manglar-verde shadow-md"
					onPointerDown={e => {
						arrastre.current = true;
						e.currentTarget.setPointerCapture(e.pointerId);
					}}
					onPointerMove={e => {
						if (!arrastre.current) return;
						const caja = raiz.current?.parentElement?.getBoundingClientRect();
						if (!caja) return;
						mover((e.clientX - caja.left) / ancho);
					}}
					onPointerUp={() => (arrastre.current = false)}
					onPointerCancel={() => (arrastre.current = false)}
					onKeyDown={e => {
						if (e.key === 'ArrowLeft') mover(posicion - 0.03);
						else if (e.key === 'ArrowRight') mover(posicion + 0.03);
						else if (e.key === 'Home') mover(0);
						else if (e.key === 'End') mover(1);
						else return;
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<SeparatorVertical className="size-5" />
				</div>
				<button
					type="button"
					className="control-mapa size-9"
					aria-label={textos.moverDerecha}
					onClick={() => mover(posicion + 0.05)}
				>
					<ChevronRight className="size-4" />
				</button>
			</div>
		</div>
	);
}
