import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { PuntoConFecha } from '@/features/datos/dominio';
import type { Cambio, Manifiesto } from '@/features/datos/esquemas';
import { useIdioma } from '@/features/idioma/idioma';
import { cn } from '@/shared/utils';

/**
 * History of one cell, pass by pass, as three aligned strips that share the
 * horizontal axis (one column per pass, in the order of the manifest):
 *
 *  1. HH and HV backscatter, in dB, on one common axis.
 *  2. Estimated tide of each pass, in metres, on its own strip — never a second
 *     axis on the dB chart.
 *  3. The class the cell got on each pass, as a colored band with its code.
 *
 * A missing value breaks the line; nothing is interpolated. The change point,
 * when there is one, is a vertical rule across the strips.
 */

const COLOR = { hh: 'var(--dato-hh)', hv: 'var(--dato-hv)', marea: 'var(--dato-marea)' };
const M = { izquierda: 44, derecha: 30, arriba: 24 };
const ALTO_DB = 132;
const ALTO_MAREA = 54;
const ALTO_BANDA = 22;
const SEPARACION = 18;

function ticks(min: number, max: number, cantidad: number) {
	const paso0 = (max - min) / cantidad || 1;
	const magnitud = 10 ** Math.floor(Math.log10(paso0));
	const paso = [1, 2, 5, 10].map(m => m * magnitud).find(p => p >= paso0) ?? paso0;
	const salida: number[] = [];
	for (let v = Math.ceil(min / paso) * paso; v <= max + 1e-9; v += paso)
		salida.push(+v.toFixed(6));
	return salida;
}

/** Splits a series into runs of consecutive non-null values. */
function tramos(valores: (number | null)[]) {
	const salida: { k: number; v: number }[][] = [];
	let actual: { k: number; v: number }[] = [];
	valores.forEach((v, k) => {
		if (v === null) {
			if (actual.length) salida.push(actual);
			actual = [];
		} else actual.push({ k, v });
	});
	if (actual.length) salida.push(actual);
	return salida;
}

type Props = {
	serie: PuntoConFecha[];
	cambio: Cambio | null;
	manifiesto: Manifiesto;
};

export function GraficaSerie({ serie, cambio, manifiesto }: Props) {
	const { t, fmt } = useIdioma();
	const zona = manifiesto.region.zona_horaria;
	const marco = useRef<HTMLDivElement>(null);
	const [ancho, setAncho] = useState(320);
	const [activo, setActivo] = useState<number | null>(null);

	useEffect(() => {
		const el = marco.current;
		if (!el) return;
		const observer = new ResizeObserver(
			([e]) => e && setAncho(Math.max(260, e.contentRect.width))
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const n = serie.length;
	const colores = useMemo(
		() => new Map((manifiesto.leyendas.clases ?? []).map(e => [e.codigo, e.color])),
		[manifiesto.leyendas.clases]
	);

	const hh = serie.map(p => p.hh_db);
	const hv = serie.map(p => p.hv_db);
	const mareas = serie.map(p => p.fecha?.marea_m ?? null);
	const decibeles = [...hh, ...hv].filter((v): v is number => v !== null);
	const hayDb = decibeles.length > 0;
	const dbMin = hayDb ? Math.floor(Math.min(...decibeles) / 5) * 5 : -25;
	const dbMax = hayDb ? Math.ceil(Math.max(...decibeles) / 5) * 5 : 0;
	const conMarea = mareas.filter((v): v is number => v !== null);
	const mareaTope = Math.max(1, Math.ceil(Math.max(0, ...conMarea.map(Math.abs))));

	const interior = ancho - M.izquierda - M.derecha;
	const x = (k: number) => M.izquierda + (n <= 1 ? interior / 2 : (interior * (k + 0.5)) / n);
	const yDb = (v: number) => M.arriba + ALTO_DB - ((v - dbMin) / (dbMax - dbMin || 1)) * ALTO_DB;
	const y0Marea = M.arriba + ALTO_DB + SEPARACION;
	const yMarea = (v: number) => y0Marea + ALTO_MAREA / 2 - (v / mareaTope) * (ALTO_MAREA / 2);
	const y0Banda = y0Marea + ALTO_MAREA + SEPARACION;
	const alto = y0Banda + ALTO_BANDA + 24;
	const columna = n ? interior / n : interior;

	const kCambio = cambio ? serie.findIndex(p => p.fecha_id === cambio.fecha_id) : -1;
	// Date labels: the last pass first, then every pass that keeps clear of the ones placed.
	const separacion = Math.max(1, Math.ceil(58 / columna));
	const conEtiqueta = new Set<number>(n ? [n - 1] : []);
	for (let k = 0; k < n; k++) {
		if ([...conEtiqueta].every(e => Math.abs(e - k) >= separacion)) conEtiqueta.add(k);
	}

	const linea = (valores: (number | null)[]) =>
		tramos(valores).map(tramo =>
			tramo
				.map((p, i) => `${i ? 'L' : 'M'}${x(p.k).toFixed(1)} ${yDb(p.v).toFixed(1)}`)
				.join('')
		);

	const alMover = (clientX: number) => {
		const caja = marco.current?.getBoundingClientRect();
		if (!caja || !n) return;
		const k = Math.floor(((clientX - caja.left - M.izquierda) / interior) * n);
		setActivo(Math.min(n - 1, Math.max(0, k)));
	};
	const alTeclear = (e: KeyboardEvent) => {
		if (!n) return;
		if (e.key === 'ArrowRight') setActivo(a => Math.min(n - 1, (a ?? -1) + 1));
		else if (e.key === 'ArrowLeft') setActivo(a => Math.max(0, (a ?? n) - 1));
		else if (e.key === 'Escape') setActivo(null);
		else return;
		e.preventDefault();
	};

	const punto = activo !== null ? serie[activo] : undefined;
	const ultimo = (valores: (number | null)[]) => {
		for (let k = valores.length - 1; k >= 0; k--)
			if (valores[k] !== null) return { k, v: valores[k]! };
		return null;
	};
	const finHh = ultimo(hh);
	const finHv = ultimo(hv);
	// Keep the two end labels apart when the lines finish close together.
	const separar = finHh && finHv && Math.abs(yDb(finHh.v) - yDb(finHv.v)) < 13;

	return (
		<div className="space-y-2">
			<ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label={t.grafica.leyenda}>
				<li className="flex items-center gap-1.5">
					<svg width="26" height="10" aria-hidden>
						<line x1="0" x2="26" y1="5" y2="5" stroke={COLOR.hh} strokeWidth="2" />
						<circle cx="13" cy="5" r="4" fill={COLOR.hh} />
					</svg>
					{t.grafica.hh}
				</li>
				<li className="flex items-center gap-1.5">
					<svg width="26" height="10" aria-hidden>
						<line
							x1="0"
							x2="26"
							y1="5"
							y2="5"
							stroke={COLOR.hv}
							strokeWidth="2"
							strokeDasharray="5 3"
						/>
						<rect x="9" y="1" width="8" height="8" fill={COLOR.hv} />
					</svg>
					{t.grafica.hv}
				</li>
				<li className="flex items-center gap-1.5">
					<svg width="12" height="10" aria-hidden>
						<circle cx="6" cy="5" r="4" fill={COLOR.marea} />
					</svg>
					{t.grafica.marea}
				</li>
			</ul>

			<div
				ref={marco}
				className="relative"
				onPointerMove={e => alMover(e.clientX)}
				onPointerDown={e => alMover(e.clientX)}
				onPointerLeave={e => e.pointerType === 'mouse' && setActivo(null)}
			>
				<svg
					width={ancho}
					height={alto}
					role="img"
					aria-label={t.grafica.descripcion(n)}
					tabIndex={0}
					onKeyDown={alTeclear}
					onBlur={() => setActivo(null)}
					className="block touch-pan-y rounded-lg text-manglar-oceano"
				>
					{/* dB strip */}
					{ticks(dbMin, dbMax, 4).map(v => (
						<g key={`db${v}`}>
							<line
								x1={M.izquierda}
								x2={ancho - M.derecha}
								y1={yDb(v)}
								y2={yDb(v)}
								stroke="currentColor"
								strokeOpacity={0.16}
							/>
							<text
								x={M.izquierda - 6}
								y={yDb(v) + 4}
								textAnchor="end"
								className="fill-current text-[11px]"
							>
								{fmt.numero(v)}
							</text>
						</g>
					))}
					<text
						x={2}
						y={M.arriba + 2}
						className="fill-current text-[11px]"
						dominantBaseline="hanging"
					>
						dB
					</text>

					{/* tide strip */}
					<line
						x1={M.izquierda}
						x2={ancho - M.derecha}
						y1={yMarea(0)}
						y2={yMarea(0)}
						stroke="currentColor"
						strokeOpacity={0.35}
					/>
					{[mareaTope, -mareaTope].map(v => (
						<g key={`m${v}`}>
							<line
								x1={M.izquierda}
								x2={ancho - M.derecha}
								y1={yMarea(v)}
								y2={yMarea(v)}
								stroke="currentColor"
								strokeOpacity={0.14}
							/>
							<text
								x={M.izquierda - 6}
								y={yMarea(v) + 4}
								textAnchor="end"
								className="fill-current text-[11px]"
							>
								{v > 0 ? `+${v}` : `−${Math.abs(v)}`}
							</text>
						</g>
					))}
					<text x={2} y={yMarea(0) + 4} className="fill-current text-[11px]">
						m
					</text>

					{kCambio >= 0 && (
						<g>
							<line
								x1={x(kCambio)}
								x2={x(kCambio)}
								y1={14}
								y2={y0Banda + ALTO_BANDA}
								stroke="var(--manglar-carmesi)"
								strokeWidth={1.5}
								strokeDasharray="3 3"
							/>
							<text
								x={x(kCambio)}
								y={1}
								textAnchor={kCambio > n / 2 ? 'end' : 'start'}
								dx={kCambio > n / 2 ? -5 : 5}
								dominantBaseline="hanging"
								className="fill-[var(--manglar-carmesi)] text-[11px] font-semibold"
							>
								{t.grafica.cambio}
							</text>
						</g>
					)}

					{linea(hh).map((d, i) => (
						<path
							key={`hh${i}`}
							d={d}
							fill="none"
							stroke={COLOR.hh}
							strokeWidth={2}
							strokeLinejoin="round"
						/>
					))}
					{linea(hv).map((d, i) => (
						<path
							key={`hv${i}`}
							d={d}
							fill="none"
							stroke={COLOR.hv}
							strokeWidth={2}
							strokeDasharray="5 3"
							strokeLinejoin="round"
						/>
					))}
					{n <= 40 &&
						serie.map((p, k) => (
							<g key={p.fecha_id}>
								{p.hh_db !== null && (
									<circle
										cx={x(k)}
										cy={yDb(p.hh_db)}
										r={activo === k ? 5 : 3.2}
										fill={COLOR.hh}
										stroke="var(--manglar-papel)"
										strokeWidth={1.5}
									/>
								)}
								{p.hv_db !== null && (
									<rect
										x={x(k) - (activo === k ? 4.5 : 3)}
										y={yDb(p.hv_db) - (activo === k ? 4.5 : 3)}
										width={activo === k ? 9 : 6}
										height={activo === k ? 9 : 6}
										fill={COLOR.hv}
										stroke="var(--manglar-papel)"
										strokeWidth={1.5}
									/>
								)}
							</g>
						))}
					{finHh && (
						<text
							x={x(finHh.k) + 8}
							y={yDb(finHh.v) + (separar ? -3 : 4)}
							className="fill-current text-[11px] font-semibold"
						>
							HH
						</text>
					)}
					{finHv && (
						<text
							x={x(finHv.k) + 8}
							y={yDb(finHv.v) + (separar ? 11 : 4)}
							className="fill-current text-[11px] font-semibold"
						>
							HV
						</text>
					)}

					{serie.map((p, k) => {
						const marea = p.fecha?.marea_m ?? null;
						const color = colores.get(p.clase);
						return (
							<g key={`c${p.fecha_id}`}>
								{marea !== null ? (
									<circle
										cx={x(k)}
										cy={yMarea(marea)}
										r={activo === k ? 5 : 3.5}
										fill={COLOR.marea}
										stroke="var(--manglar-papel)"
										strokeWidth={1.5}
									/>
								) : (
									<text
										x={x(k)}
										y={yMarea(0) + 4}
										textAnchor="middle"
										className="fill-current text-[11px] opacity-70"
									>
										×
									</text>
								)}
								<rect
									x={x(k) - columna / 2 + 1}
									y={y0Banda}
									width={Math.max(1, columna - 2)}
									height={ALTO_BANDA}
									rx={3}
									fill={color ?? 'transparent'}
									stroke={color ? 'none' : 'currentColor'}
									strokeDasharray={color ? undefined : '3 2'}
								/>
								{columna >= 20 && (
									<text
										x={x(k)}
										y={y0Banda + ALTO_BANDA / 2 + 4}
										textAnchor="middle"
										className={cn(
											'text-[10px] font-semibold',
											color ? 'fill-white' : 'fill-current'
										)}
									>
										{p.clase}
									</text>
								)}
								{conEtiqueta.has(k) && p.fecha && (
									<text
										x={x(k)}
										y={alto - 6}
										textAnchor="middle"
										className="fill-current text-[11px]"
									>
										{fmt.fechaCorta(p.fecha.fecha_hora, zona)}
									</text>
								)}
							</g>
						);
					})}

					{activo !== null && (
						<line
							x1={x(activo)}
							x2={x(activo)}
							y1={M.arriba}
							y2={y0Banda + ALTO_BANDA}
							stroke="currentColor"
							strokeOpacity={0.5}
						/>
					)}
				</svg>

				{punto && activo !== null && (
					<div
						role="status"
						className="tarjeta pointer-events-none absolute top-0 z-10 w-52 bg-[#fbf7ec] p-2.5 text-sm shadow-lg"
						style={{
							left: Math.min(Math.max(0, x(activo) - 104), Math.max(0, ancho - 208)),
							transform: 'translateY(calc(-100% - 6px))'
						}}
					>
						<p className="font-semibold">
							{punto.fecha
								? fmt.fechaHora(punto.fecha.fecha_hora, zona)
								: punto.fecha_id}
						</p>
						<dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
							<dt>HH</dt>
							<dd className="text-right tabular-nums">
								{punto.hh_db === null
									? t.comun.sinDato
									: fmt.decibeles(punto.hh_db)}
							</dd>
							<dt>HV</dt>
							<dd className="text-right tabular-nums">
								{punto.hv_db === null
									? t.comun.sinDato
									: fmt.decibeles(punto.hv_db)}
							</dd>
							<dt>{t.grafica.mareaCorto}</dt>
							<dd className="text-right tabular-nums">
								{punto.fecha && punto.fecha.marea_m !== null
									? `${fmt.metros(punto.fecha.marea_m)}, ${t.nivelMarea[punto.fecha.marea_nivel]}`
									: t.partitura.sinEstimacion}
							</dd>
							<dt>{t.grafica.clase}</dt>
							<dd className="text-right">{t.clases[punto.clase].nombre}</dd>
						</dl>
					</div>
				)}
			</div>
			<p className="etiqueta">{t.grafica.ayuda}</p>

			<details className="text-sm">
				<summary className="cursor-pointer py-2 font-medium underline underline-offset-4">
					{t.grafica.verTabla}
				</summary>
				<div className="max-h-64 overflow-auto">
					<table className="w-full border-collapse text-left tabular-nums">
						<caption className="sr-only">{t.grafica.descripcion(n)}</caption>
						<thead>
							<tr className="border-b border-manglar-olivo/40">
								<th scope="col" className="py-1 pr-2 font-semibold">
									{t.grafica.pasada}
								</th>
								<th scope="col" className="px-2 text-right font-semibold">
									HH
								</th>
								<th scope="col" className="px-2 text-right font-semibold">
									HV
								</th>
								<th scope="col" className="px-2 text-right font-semibold">
									{t.grafica.mareaCorto}
								</th>
								<th scope="col" className="pl-2 font-semibold">
									{t.grafica.clase}
								</th>
							</tr>
						</thead>
						<tbody>
							{serie.map(p => (
								<tr key={p.fecha_id} className="border-b border-manglar-olivo/20">
									<th
										scope="row"
										className="py-1 pr-2 font-normal whitespace-nowrap"
									>
										{p.fecha
											? fmt.fechaCorta(p.fecha.fecha_hora, zona)
											: p.fecha_id}
									</th>
									<td className="px-2 text-right">
										{p.hh_db === null ? '—' : fmt.numero(p.hh_db, 1)}
									</td>
									<td className="px-2 text-right">
										{p.hv_db === null ? '—' : fmt.numero(p.hv_db, 1)}
									</td>
									<td className="px-2 text-right">
										{p.fecha && p.fecha.marea_m !== null
											? fmt.numero(p.fecha.marea_m, 2)
											: '—'}
									</td>
									<td className="pl-2">{p.clase}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
		</div>
	);
}
