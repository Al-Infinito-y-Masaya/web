import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { env } from '@/config/env';
import { urlDeCapa } from '@/features/datos/api';
import { excluidaPorLluvia, rangoDeMarea, sinMarea } from '@/features/datos/dominio';
import type { Fecha, Manifiesto } from '@/features/datos/esquemas';
import { EstadoSesion } from '@/features/datos/estado-sesion';
import { useSesion } from '@/features/datos/sesion';
import { LeyendaClases, LeyendaFrecuencia, LeyendaRgb } from '@/features/explorar/leyendas';
import { Reproductor } from '@/features/explorar/reproductor';
import { useIdioma } from '@/features/idioma/idioma';
import type { Caja } from '@/features/mapa/proyeccion';
import { Visor, type CapaRaster, type EstadoCapa } from '@/features/mapa/visor';
import { NotaMusical } from '@/features/marca/marca';
import { sonido } from '@/features/partitura/sonido';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/utils';

/**
 * Guided story in five acts. Scrolling an act into view moves the map to its
 * scene and turns on its layer: reference image, tide score, radar composite,
 * classes and connectivity. The words explain; the layers are always the
 * published ones of the loaded version, never illustrations.
 */

type Escena = 'contexto' | 'marea' | 'rgb' | 'clases' | 'conectividad';
const ESCENAS: Escena[] = ['contexto', 'marea', 'rgb', 'clases', 'conectividad'];

/** The pass the story shows: the latest one at high tide, or the latest one. */
function pasadaDelRelato(manifiesto: Manifiesto): Fecha | undefined {
	const fechas = manifiesto.fechas;
	return [...fechas].reverse().find(f => f.marea_nivel === 'alta') ?? fechas[fechas.length - 1];
}

/** Wider box around the region, to place it in the gulf. */
function alrededores(caja: Caja, factor: number): Caja {
	const dx = ((caja[2] - caja[0]) * (factor - 1)) / 2;
	const dy = ((caja[3] - caja[1]) * (factor - 1)) / 2;
	return [caja[0] - dx, caja[1] - dy, caja[2] + dx, caja[3] + dy];
}

const MARGEN_ESCENA = { arriba: 60, abajo: 60, izquierda: 24, derecha: 24 };
/** Leaves room for the score at the foot of the scene. */
const MARGEN_PARTITURA = { arriba: 60, abajo: 232, izquierda: 24, derecha: 24 };

export function Relato() {
	const { t } = useIdioma();
	const sesion = useSesion();
	const [acto, setActo] = useState(0);
	const pasos = useRef<(HTMLElement | null)[]>([]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			entradas => {
				for (const entrada of entradas) {
					if (entrada.isIntersecting)
						setActo(Number((entrada.target as HTMLElement).dataset.acto));
				}
			},
			// The act crossing the middle of the screen is the current one.
			{ rootMargin: '-45% 0px -45% 0px' }
		);
		pasos.current.forEach(el => el && observer.observe(el));
		return () => observer.disconnect();
	}, []);

	const irA = (k: number) =>
		pasos.current[k]?.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'auto'
				: 'smooth',
			block: 'start'
		});

	return (
		<div className="lg:grid lg:grid-cols-[minmax(22rem,2fr)_3fr]">
			<div className="sticky top-0 z-10 h-[40dvh] border-b-2 border-manglar-olivo lg:order-last lg:h-[calc(100dvh-4rem)] lg:border-b-0 lg:border-l-2 lg:border-dashed">
				{sesion.estado === 'lista' && sesion.manifiesto && sesion.origen ? (
					<Escenario
						key={`${sesion.manifiesto.region.codigo}@${sesion.manifiesto.version}`}
						manifiesto={sesion.manifiesto}
						origen={sesion.origen}
						escena={ESCENAS[acto]!}
					/>
				) : (
					<EstadoSesion oscuro className="h-full" />
				)}
			</div>

			<div className="papel">
				{ESCENAS.map((escena, k) => {
					const texto = t.relato.actos[escena];
					return (
						<article
							key={escena}
							ref={el => void (pasos.current[k] = el)}
							data-acto={k}
							aria-labelledby={`acto-${k}`}
							className="relative flex min-h-[62dvh] scroll-mt-[40dvh] flex-col justify-center gap-5 px-6 py-12 sm:px-10 lg:min-h-[calc(100dvh-4rem)] lg:scroll-mt-0"
						>
							<div
								aria-hidden
								className="absolute top-8 right-8 hidden gap-3 text-manglar-olivo lg:flex"
							>
								<NotaMusical tipo="corchea" className="size-5" />
								<NotaMusical tipo="doble" className="size-8" />
								<NotaMusical tipo="negra" className="size-4" />
							</div>
							<p className="etiqueta text-base">
								{t.relato.acto(k + 1, ESCENAS.length)}
							</p>
							<h2
								id={`acto-${k}`}
								className="crayola max-w-md text-[clamp(2.2rem,5.2vw,3.6rem)] font-bold"
							>
								{texto.titulo}
							</h2>
							<p className="max-w-prose text-lg leading-relaxed">{texto.cuerpo}</p>
							<div className="tarjeta max-w-prose space-y-1 p-4">
								<h3 className="text-base font-semibold">{t.relato.comoLeer}</h3>
								<p className="leading-relaxed">{texto.lectura}</p>
							</div>

							<ol aria-label={t.relato.progreso} className="flex gap-1.5">
								{ESCENAS.map((_, j) => (
									<li
										key={j}
										aria-current={j === k ? 'step' : undefined}
										className={cn(
											'h-1.5 rounded-full',
											j === k
												? 'w-9 bg-manglar-verde'
												: j < k
													? 'w-4 bg-manglar-verde'
													: 'w-4 bg-manglar-arena'
										)}
									>
										<span className="sr-only">
											{t.relato.acto(j + 1, ESCENAS.length)}
										</span>
									</li>
								))}
							</ol>

							<div className="flex flex-wrap items-center gap-3">
								{k < ESCENAS.length - 1 ? (
									<button
										type="button"
										className="boton boton-primario"
										onClick={() => irA(k + 1)}
									>
										{t.relato.seguir}
									</button>
								) : (
									<Link
										to="/explorar"
										search={{ modo: 'sintonia' }}
										className="boton boton-primario"
									>
										{t.relato.explorarConectividad}
									</Link>
								)}
								<Link to="/explorar" className="boton boton-fantasma">
									{t.relato.irAlMapa}
								</Link>
							</div>
							<p className="etiqueta">{t.relato.pendiente}</p>
						</article>
					);
				})}
			</div>
		</div>
	);
}

function Escenario({
	manifiesto: m,
	origen,
	escena
}: {
	manifiesto: Manifiesto;
	origen: 'api' | 'respaldo';
	escena: Escena;
}) {
	const { t, fmt } = useIdioma();
	const pasada = useMemo(() => pasadaDelRelato(m), [m]);
	const ancha = useMediaQuery('(min-width: 640px)');
	const [fallo, setFallo] = useState<string | null>(null);
	const [nota, setNota] = useState(pasada?.id);
	const rango = useMemo(() => rangoDeMarea(m.fechas), [m.fechas]);
	const tocar = (id: string) => {
		const fecha = m.fechas.find(f => f.id === id);
		if (!fecha) return;
		setNota(id);
		sonido.tocarMarea(fecha.marea_m, rango, excluidaPorLluvia(fecha, m));
	};
	const limites = m.limites ?? m.region.bbox;
	const faltaMarea = sinMarea(m);
	const tipoConectividad = faltaMarea ? 'if' : 'if_alta';

	const capa = useMemo<CapaRaster | null>(() => {
		const ruta =
			escena === 'rgb'
				? pasada?.capas.rgb
				: escena === 'clases'
					? pasada?.capas.clases
					: escena === 'conectividad'
						? m.capas[tipoConectividad]
						: undefined;
		return ruta ? { id: escena, url: urlDeCapa(ruta, origen) } : null;
	}, [escena, pasada, m.capas, tipoConectividad, origen]);

	// Each act has its scene: the first one steps back to show the gulf around the region.
	const encuadre = useMemo(
		() => (escena === 'contexto' ? alrededores(limites, 2.4) : limites),
		[escena, limites]
	);

	const alEstado = (id: string, estado: EstadoCapa) =>
		setFallo(f => (estado === 'error' ? id : f === id ? null : f));
	const capaFallo = capa !== null && fallo === capa.id;
	const conPasada = (escena === 'rgb' || escena === 'clases') && pasada;
	const nombreCapa =
		escena === 'rgb'
			? t.ritmo.rgb
			: escena === 'clases'
				? t.ritmo.clases
				: escena === 'conectividad'
					? faltaMarea
						? t.campos.ifTotal
						: t.campos.ifAlta
					: t.relato.referencia;

	return (
		<div className="relative h-full">
			<Visor
				className="absolute inset-0"
				interactivo={false}
				limites={limites}
				encuadre={encuadre}
				limitesCapas={m.limites}
				capas={capa ? [capa] : []}
				teselas={env.tilesUrl || undefined}
				margen={escena === 'marea' && ancha ? MARGEN_PARTITURA : MARGEN_ESCENA}
				onEstadoCapa={alEstado}
				textos={t.mapa.visor}
				descripcion={
					conPasada
						? t.mapa.descripcionPasada(
								nombreCapa,
								fmt.fechaLarga(pasada.fecha_hora, m.region.zona_horaria)
							)
						: t.mapa.descripcionCapa(nombreCapa, m.region.nombre)
				}
				atribucion={env.tilesUrl ? t.mapa.atribucion : t.mapa.atribucionSinBase}
			/>

			<div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-2">
				<p className="rounded-full bg-manglar-verde px-3 py-1.5 text-sm text-manglar-papel shadow-md">
					<strong>{nombreCapa}</strong>
					{conPasada && ` · ${fmt.fechaLarga(pasada.fecha_hora, m.region.zona_horaria)}`}
				</p>
				{capaFallo && (
					<p
						role="alert"
						className="papel max-w-sm rounded-2xl px-4 py-2.5 text-sm shadow-md"
					>
						<strong className="block">{t.mapa.capaFallo}</strong>
						{t.relato.capaFallo}
					</p>
				)}
				{escena !== 'contexto' && escena !== 'marea' && !capa && (
					<p
						role="status"
						className="papel max-w-sm rounded-2xl px-4 py-2.5 text-sm shadow-md"
					>
						<strong className="block">{t.mapa.capaSinPublicar}</strong>
						{t.mapa.capaSinPublicarDetalle}
					</p>
				)}
			</div>

			{escena === 'marea' && (
				<div className="absolute inset-x-3 bottom-8 hidden sm:block">
					<Reproductor
						manifiesto={m}
						seleccion={nota}
						onSeleccion={tocar}
						sonando={nota}
					/>
				</div>
			)}
			{(escena === 'rgb' || escena === 'clases' || escena === 'conectividad') && (
				<div className="panel absolute top-3 right-3 hidden max-h-[70%] w-72 overflow-y-auto lg:block [&>section]:border-0 [&>section]:bg-transparent">
					{escena === 'rgb' && <LeyendaRgb />}
					{escena === 'clases' && <LeyendaClases manifiesto={m} />}
					{escena === 'conectividad' && (
						<LeyendaFrecuencia manifiesto={m} capa={tipoConectividad} />
					)}
				</div>
			)}
		</div>
	);
}
