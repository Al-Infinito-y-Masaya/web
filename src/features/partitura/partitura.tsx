import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { excluidaPorLluvia, ms, rangoDeMarea } from '@/features/datos/dominio';
import type { Brecha, Fecha } from '@/features/datos/esquemas';
import { useIdioma } from '@/features/idioma/idioma';
import { cn } from '@/shared/utils';

/**
 * The tide as a score. This is data, not decoration:
 *
 *  - one note per satellite pass, in the order of the manifest;
 *  - the height of the note on the staff is the estimated tide (`marea_m`);
 *  - the note head tells the tide level: filled = high, grey = mid, hollow = low;
 *  - a pass without tide estimate sits below the staff as a rest (×);
 *  - a pass with heavy rain before it is faint and carries a drop;
 *  - an instrument gap is a hatched band without a note. Nothing is interpolated.
 *
 * Passes are evenly spaced (one beat each) so every note stays a comfortable
 * target; the dates under the staff carry the calendar.
 */

type Casilla =
	{ tipo: 'pasada'; fecha: Fecha; indice: number } | { tipo: 'brecha'; brecha: Brecha };

function casillas(fechas: readonly Fecha[], brechas: readonly Brecha[]): Casilla[] {
	const pendientes = [...brechas].sort((a, b) => ms(a.desde) - ms(b.desde));
	const salida: Casilla[] = [];
	fechas.forEach((fecha, indice) => {
		while (pendientes[0] && ms(pendientes[0].desde) < ms(fecha.fecha_hora)) {
			const brecha = pendientes.shift()!;
			// A gap is drawn only between two passes; before the first there is no series yet.
			if (indice > 0) salida.push({ tipo: 'brecha', brecha });
		}
		salida.push({ tipo: 'pasada', fecha, indice });
	});
	return salida;
}

const ALTO = 150;
const PENTAGRAMA = { arriba: 22, abajo: 82 };
const FILA_SILENCIO = 104;
const FILA_FECHA = 136;
const MARGEN = { izquierda: 68, derecha: 16 };
const PASO_MINIMO = 30;

export type DatosPartitura = {
	fechas: Fecha[];
	brechas: Brecha[];
	region: { zona_horaria: string };
	umbrales: { lluvia_max_mm?: number };
};

type Props = {
	manifiesto: DatosPartitura;
	seleccion: string | undefined;
	onSeleccion: (id: string) => void;
	/** Second pass of a comparison (B); the selection is A. */
	comparacion?: string | null;
	/** In connectivity mode only the passes counted for high tide stay bright. */
	modo?: 'pasada' | 'conectividad';
	/** Pass being played right now, for the pulse. */
	sonando?: string | null;
	className?: string;
};

export function Partitura({
	manifiesto,
	seleccion,
	onSeleccion,
	comparacion,
	modo = 'pasada',
	sonando,
	className
}: Props) {
	const { t, fmt } = useIdioma();
	const zona = manifiesto.region.zona_horaria;
	const fechas = manifiesto.fechas;
	const items = useMemo(() => casillas(fechas, manifiesto.brechas), [fechas, manifiesto.brechas]);
	const [min, max] = useMemo(() => rangoDeMarea(fechas), [fechas]);
	const haySilencios = fechas.some(f => f.marea_m === null);

	const marco = useRef<HTMLDivElement>(null);
	const [anchoMarco, setAnchoMarco] = useState(0);
	useEffect(() => {
		const el = marco.current;
		if (!el) return;
		const observer = new ResizeObserver(([e]) => e && setAnchoMarco(e.contentRect.width));
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const libre = Math.max(0, anchoMarco - MARGEN.izquierda - MARGEN.derecha);
	const paso = Math.max(PASO_MINIMO, items.length ? libre / items.length : 0);
	const ancho = Math.max(anchoMarco, MARGEN.izquierda + MARGEN.derecha + paso * items.length);
	const xDe = (k: number) => MARGEN.izquierda + paso * (k + 0.5);
	const yDe = (marea: number) =>
		PENTAGRAMA.abajo - ((marea - min) / (max - min)) * (PENTAGRAMA.abajo - PENTAGRAMA.arriba);

	// Keep the selected note in view when the score scrolls sideways.
	const kSeleccion = items.findIndex(i => i.tipo === 'pasada' && i.fecha.id === seleccion);
	useEffect(() => {
		const el = marco.current;
		if (!el || kSeleccion < 0 || el.scrollWidth <= el.clientWidth) return;
		const x = MARGEN.izquierda + paso * (kSeleccion + 0.5);
		if (x < el.scrollLeft + 60 || x > el.scrollLeft + el.clientWidth - 60) {
			el.scrollTo({ left: x - el.clientWidth / 2, behavior: 'smooth' });
		}
	}, [kSeleccion, paso]);

	const alTeclear = (e: KeyboardEvent<SVGGElement>, indice: number) => {
		const destino =
			e.key === 'ArrowRight'
				? indice + 1
				: e.key === 'ArrowLeft'
					? indice - 1
					: e.key === 'Home'
						? 0
						: e.key === 'End'
							? fechas.length - 1
							: null;
		if (destino === null) return;
		e.preventDefault();
		const fecha = fechas[Math.min(fechas.length - 1, Math.max(0, destino))];
		if (!fecha) return;
		onSeleccion(fecha.id);
		marco.current?.querySelector<SVGGElement>(`[data-pasada="${fecha.id}"]`)?.focus();
	};

	const lineas = [max, max / 2, 0, min / 2, min];
	// Dates under the notes: always for the selected and compared passes, then as
	// many of the others as fit without touching a label already placed.
	const conFecha = useMemo(() => {
		const separacion = Math.max(1, Math.ceil(70 / paso));
		const elegidas = fechas
			.map((f, k) =>
				f.id === seleccion || (comparacion != null && f.id === comparacion) ? k : -1
			)
			.filter(k => k >= 0);
		const libre = (k: number) => elegidas.every(e => Math.abs(e - k) >= separacion);
		for (const k of [0, fechas.length - 1]) if (k >= 0 && libre(k)) elegidas.push(k);
		fechas.forEach((_, k) => libre(k) && elegidas.push(k));
		return new Set(elegidas);
	}, [fechas, seleccion, comparacion, paso]);

	return (
		<div
			ref={marco}
			className={cn('sobre-oscuro overflow-x-auto overflow-y-hidden', className)}
		>
			<svg
				width={ancho}
				height={ALTO}
				viewBox={`0 0 ${ancho} ${ALTO}`}
				role="listbox"
				aria-label={t.partitura.etiqueta}
				aria-orientation="horizontal"
				className="block text-manglar-papel"
			>
				<defs>
					<pattern
						id="trama-brecha"
						width="7"
						height="7"
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(-45)"
					>
						<rect width="2" height="7" fill="#ead39d" fillOpacity="0.55" />
					</pattern>
				</defs>
				{lineas.map((valor, k) => (
					<g key={k}>
						<line
							x1={MARGEN.izquierda - 6}
							x2={ancho - MARGEN.derecha + 6}
							y1={yDe(valor)}
							y2={yDe(valor)}
							stroke="currentColor"
							strokeOpacity={valor === 0 ? 0.6 : 0.28}
							strokeWidth={1}
						/>
						{k % 2 === 0 && (
							<text
								x={MARGEN.izquierda - 12}
								y={yDe(valor) + 4}
								textAnchor="end"
								className="fill-current text-[12px]"
							>
								{valor === 0 ? '0 m' : fmt.metros(valor).replace(/[.,]00/, '')}
							</text>
						)}
					</g>
				))}
				{haySilencios && (
					<text
						x={MARGEN.izquierda - 12}
						y={FILA_SILENCIO + 4}
						textAnchor="end"
						className="fill-current text-[11px] opacity-80"
					>
						{t.partitura.sinEstimacionCorto}
					</text>
				)}

				{items.map((item, k) => {
					const x = xDe(k);
					if (item.tipo === 'brecha') {
						return (
							<g key={`brecha-${item.brecha.desde}`} role="presentation">
								<title>
									{t.partitura.brecha(
										fmt.fechaCorta(item.brecha.desde, zona),
										fmt.fechaCorta(item.brecha.hasta, zona)
									)}
								</title>
								<rect
									x={x - paso / 2 + 4}
									y={PENTAGRAMA.arriba - 8}
									width={paso - 8}
									height={PENTAGRAMA.abajo - PENTAGRAMA.arriba + 16}
									rx={4}
									fill="url(#trama-brecha)"
									stroke="#ead39d"
									strokeOpacity={0.6}
									strokeDasharray="4 3"
								/>
								<text
									x={x}
									y={FILA_FECHA}
									textAnchor="middle"
									className="fill-current text-[10px] opacity-80"
								>
									{t.partitura.brechaCorto}
								</text>
							</g>
						);
					}

					const { fecha, indice } = item;
					const esA = fecha.id === seleccion;
					const esB = comparacion != null && fecha.id === comparacion;
					const lluvia = excluidaPorLluvia(fecha, manifiesto);
					const tenue = lluvia || (modo === 'conectividad' && !fecha.usada_en_if_alta);
					const y = fecha.marea_m === null ? FILA_SILENCIO : yDe(fecha.marea_m);
					const descripcion = t.partitura.nota({
						fecha: fmt.fechaLarga(fecha.fecha_hora, zona),
						hora: fmt.hora(fecha.fecha_hora, zona),
						orbita: t.orbita(fecha.orbita),
						marea:
							fecha.marea_m === null
								? null
								: `${fmt.metros(fecha.marea_m)}, ${t.nivelMarea[fecha.marea_nivel]}`,
						lluvia,
						cuenta: fecha.usada_en_if_alta
					});

					return (
						<g
							key={fecha.id}
							role="option"
							aria-selected={esA}
							aria-label={descripcion}
							data-pasada={fecha.id}
							tabIndex={esA || (kSeleccion < 0 && indice === 0) ? 0 : -1}
							className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[#ead39d]"
							onClick={() => onSeleccion(fecha.id)}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									onSeleccion(fecha.id);
								} else alTeclear(e, indice);
							}}
						>
							<title>{descripcion}</title>
							<rect
								x={x - paso / 2 + 1}
								y={2}
								width={paso - 2}
								height={ALTO - 4}
								rx={8}
								fill="#ead39d"
								fillOpacity={esA ? 0.16 : esB ? 0.1 : 0}
								stroke="transparent"
								strokeWidth={2}
							/>
							{(esA || esB) && (
								<line
									x1={x}
									x2={x}
									y1={8}
									y2={FILA_FECHA - 14}
									stroke="#ead39d"
									strokeWidth={esA ? 2 : 1.5}
									strokeDasharray={esB ? '4 4' : undefined}
								/>
							)}
							<g
								opacity={tenue ? 0.4 : 1}
								className={cn(sonando === fecha.id && 'pulso-nota')}
							>
								<Nota x={x} y={y} fecha={fecha} destacada={esA || esB} />
							</g>
							{lluvia && <Gota x={x + 9} y={y - 30} />}
							{conFecha.has(indice) && (
								<text
									x={x}
									y={FILA_FECHA}
									textAnchor="middle"
									className={cn(
										'fill-current text-[12px]',
										esA || esB ? 'font-semibold' : 'opacity-75'
									)}
								>
									{comparacion != null && (esA || esB) && (
										<tspan className="fill-[#ead39d] font-bold">
											{esA ? 'A ' : 'B '}
										</tspan>
									)}
									{fmt.fechaCorta(fecha.fecha_hora, zona)}
								</text>
							)}
						</g>
					);
				})}
			</svg>
		</div>
	);
}

/** Note head by tide level; a rest (×) when there is no tide estimate. */
function Nota({
	x,
	y,
	fecha,
	destacada
}: {
	x: number;
	y: number;
	fecha: Fecha;
	destacada: boolean;
}) {
	const color = '#ead39d';
	if (fecha.marea_m === null) {
		return (
			<g stroke={color} strokeWidth={2} strokeLinecap="round">
				<line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} />
				<line x1={x - 5} y1={y + 5} x2={x + 5} y2={y - 5} />
			</g>
		);
	}
	const nivel = fecha.marea_nivel;
	const escala = destacada ? 1.15 : 1;
	return (
		<g transform={`translate(${x} ${y}) scale(${escala})`}>
			<line x1={6.6} y1={-1.5} x2={6.6} y2={-27} stroke={color} strokeWidth={1.8} />
			<ellipse
				rx={7.4}
				ry={5.2}
				transform="rotate(-20)"
				fill={nivel === 'baja' ? 'transparent' : nivel === 'media' ? '#aab59a' : color}
				stroke={nivel === 'media' ? '#aab59a' : color}
				strokeWidth={nivel === 'baja' ? 2.2 : 1}
			/>
		</g>
	);
}

function Gota({ x, y }: { x: number; y: number }) {
	return (
		<path
			d={`M${x} ${y}c-3.2 4.4-4.6 6.6-4.6 8.6a4.6 4.6 0 0 0 9.2 0c0-2-1.4-4.2-4.6-8.6z`}
			fill="#8fc0f2"
			stroke="#14262b"
			strokeWidth={0.8}
		/>
	);
}
