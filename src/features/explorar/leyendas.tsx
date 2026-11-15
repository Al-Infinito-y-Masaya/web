import type { ReactNode } from 'react';

import { aPorcentaje } from '@/features/datos/dominio';
import type { EntradaLeyenda, Manifiesto } from '@/features/datos/esquemas';
import { useIdioma } from '@/features/idioma/idioma';
import { cn } from '@/shared/utils';

/**
 * Legends. Their colors are copied from `manifest.leyendas`: the backend paints
 * the layers, so it owns the colors and the frontend never picks its own. Every
 * entry pairs the color with words (and a pattern where the state needs it).
 */

function Marco({ titulo, children }: { titulo: string; children: ReactNode }) {
	return (
		<section className="tarjeta space-y-3 p-4">
			<h3 className="text-base font-semibold">{titulo}</h3>
			{children}
		</section>
	);
}

function Fila({ muestra, nombre, ayuda }: { muestra: ReactNode; nombre: string; ayuda?: string }) {
	return (
		<li className="flex gap-3">
			<span className="mt-0.5 shrink-0">{muestra}</span>
			<span className="min-w-0">
				<span className="block leading-tight">{nombre}</span>
				{ayuda && <span className="etiqueta block">{ayuda}</span>}
			</span>
		</li>
	);
}

export function Muestra({ color, className }: { color?: string; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn('block size-5 rounded-[5px] border border-manglar-verde/40', className)}
			style={color ? { backgroundColor: color } : undefined}
		/>
	);
}

/** Channels of the radar composite. These are the display channels, not data classes. */
export function LeyendaRgb() {
	const { t } = useIdioma();
	return (
		<Marco titulo={t.leyenda.rgb.titulo}>
			<ul className="space-y-2.5">
				<Fila
					muestra={<Muestra color="#d6393b" />}
					nombre={t.leyenda.rgb.rojo}
					ayuda={t.leyenda.rgb.rojoAyuda}
				/>
				<Fila
					muestra={<Muestra color="#2fa84f" />}
					nombre={t.leyenda.rgb.verde}
					ayuda={t.leyenda.rgb.verdeAyuda}
				/>
				<Fila
					muestra={<Muestra color="#3d6fe0" />}
					nombre={t.leyenda.rgb.azul}
					ayuda={t.leyenda.rgb.azulAyuda}
				/>
			</ul>
		</Marco>
	);
}

export function LeyendaClases({ manifiesto }: { manifiesto: Manifiesto }) {
	const { t } = useIdioma();
	const entradas = manifiesto.leyendas.clases ?? [];
	return (
		<Marco titulo={t.leyenda.clases.titulo}>
			<ul className="space-y-2.5">
				{entradas.map(entrada => {
					const clase = t.clases[entrada.codigo as keyof typeof t.clases];
					return (
						<Fila
							key={entrada.codigo}
							muestra={<Muestra color={entrada.color} />}
							nombre={clase?.nombre ?? entrada.codigo}
							ayuda={clase?.ayuda}
						/>
					);
				})}
				{/* ND is not painted by the backend: the reference image shows through. */}
				<Fila
					muestra={<Muestra className="border-dashed bg-transparent" />}
					nombre={t.clases.ND.nombre}
					ayuda={t.clases.ND.ayuda}
				/>
			</ul>
		</Marco>
	);
}

const colorDe = (entradas: EntradaLeyenda[] | undefined, codigo: string) =>
	entradas?.find(e => e.codigo === codigo)?.color;

/** Flood frequency ramp with the disconnection threshold of this version marked on it. */
export function LeyendaFrecuencia({
	manifiesto,
	capa
}: {
	manifiesto: Manifiesto;
	capa: 'if_alta' | 'if';
}) {
	const { t, fmt } = useIdioma();
	const entradas = manifiesto.leyendas[capa];
	const desde = colorDe(entradas, '0');
	const hasta = colorDe(entradas, '1');
	const umbral = manifiesto.umbrales.if_alta_desconectada;
	const minimo = manifiesto.umbrales.min_fechas_alta;
	const porcentajeUmbral = aPorcentaje(umbral);

	return (
		<Marco
			titulo={
				capa === 'if_alta' ? t.leyenda.frecuencia.titulo : t.leyenda.frecuencia.tituloTodas
			}
		>
			{desde && hasta ? (
				<div>
					<div
						role="img"
						aria-label={t.leyenda.frecuencia.rampa}
						className="relative h-4 rounded-full border border-manglar-verde/40"
						style={{ background: `linear-gradient(90deg, ${desde}, ${hasta})` }}
					>
						{capa === 'if_alta' && porcentajeUmbral !== null && (
							<span
								aria-hidden
								className="absolute -top-1 -bottom-1 w-0.5 bg-manglar-verde"
								style={{ left: `${porcentajeUmbral}%` }}
							/>
						)}
					</div>
					<div className="relative mt-1 h-5 text-sm">
						<span className="absolute left-0">0 %</span>
						{capa === 'if_alta' && porcentajeUmbral !== null && (
							<span
								className="absolute -translate-x-1/2 font-semibold"
								style={{ left: `${Math.min(80, Math.max(18, porcentajeUmbral))}%` }}
							>
								{fmt.porcentaje(umbral!)}
							</span>
						)}
						<span className="absolute right-0">100 %</span>
					</div>
				</div>
			) : (
				<p className="etiqueta">{t.leyenda.sinColores}</p>
			)}
			<ul className="space-y-2.5">
				{capa === 'if_alta' && (
					<Fila
						muestra={<Muestra className="trama" />}
						nombre={t.leyenda.frecuencia.insuficiente}
						ayuda={
							minimo !== undefined
								? t.leyenda.frecuencia.insuficienteAyuda(minimo)
								: undefined
						}
					/>
				)}
				<Fila
					muestra={<Muestra className="border-dashed bg-transparent" />}
					nombre={t.leyenda.frecuencia.fuera}
					ayuda={t.leyenda.frecuencia.fueraAyuda}
				/>
			</ul>
			{capa === 'if_alta' && umbral !== undefined && (
				<p className="etiqueta">{t.leyenda.frecuencia.umbral(fmt.porcentaje(umbral))}</p>
			)}
		</Marco>
	);
}

export function LeyendaDesconexion({
	manifiesto,
	soloDesconexion
}: {
	manifiesto: Manifiesto;
	soloDesconexion: boolean;
}) {
	const { t } = useIdioma();
	const entradas = manifiesto.leyendas.desconexion ?? [];
	const minimo = manifiesto.umbrales.min_fechas_alta;
	return (
		<Marco titulo={t.leyenda.desconexion.titulo}>
			{entradas.length === 0 && <p className="etiqueta">{t.leyenda.sinColores}</p>}
			<ul className="space-y-2.5">
				{entradas
					.filter(e => !(soloDesconexion && e.codigo === 'conectada'))
					.map(entrada => {
						const texto =
							t.leyenda.desconexion.estados[
								entrada.codigo as keyof typeof t.leyenda.desconexion.estados
							];
						const insuficiente = entrada.codigo === 'insuficiente';
						return (
							<Fila
								key={entrada.codigo}
								muestra={
									<Muestra
										color={insuficiente ? undefined : entrada.color}
										className={insuficiente ? 'trama' : undefined}
									/>
								}
								nombre={texto?.nombre ?? entrada.codigo}
								ayuda={
									insuficiente && minimo !== undefined
										? t.leyenda.frecuencia.insuficienteAyuda(minimo)
										: texto?.ayuda
								}
							/>
						);
					})}
			</ul>
		</Marco>
	);
}

const canal = (hex: string, desde: number) => parseInt(hex.slice(desde, desde + 2), 16) / 255;

/**
 * The "only possible disconnection" filter hides the connected cells of the
 * disconnection layer. The layer is a finished PNG, so the cells are hidden
 * with an SVG filter keyed on the legend color of "conectada" (greener than
 * red) against the other states. If a future palette breaks that assumption
 * this returns `false` and the caller shows the whole layer instead of a wrong
 * one.
 */
export function sePuedeFiltrarConectadas(manifiesto: Manifiesto) {
	const entradas = manifiesto.leyendas.desconexion;
	if (!entradas?.length) return false;
	return entradas.every(e => {
		if (!/^#[0-9a-f]{6}$/i.test(e.color)) return false;
		const diferencia = canal(e.color, 1) - canal(e.color, 3);
		return e.codigo === 'conectada' ? diferencia <= -0.1 : diferencia >= -0.03;
	});
}

export const FILTRO_SOLO_DESCONEXION = 'filtro-solo-desconexion';

export function FiltroSoloDesconexion() {
	return (
		<svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
			<defs>
				<filter id={FILTRO_SOLO_DESCONEXION} colorInterpolationFilters="sRGB">
					<feColorMatrix
						in="SourceGraphic"
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  20 -20 0 0 1.5"
						result="visibles"
					/>
					<feComposite in="SourceGraphic" in2="visibles" operator="in" />
				</filter>
			</defs>
		</svg>
	);
}
