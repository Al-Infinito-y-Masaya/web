import { Link } from '@tanstack/react-router';
import { RotateCcw, RotateCw, SkipForward } from 'lucide-react';

import { useSesion } from '@/features/datos/sesion';
import { useIdioma } from '@/features/idioma/idioma';
import { CodigoAbiertoPie } from '@/features/marca/codigo-abierto';
import { Isotipo, NotaMusical } from '@/features/marca/marca';
import { Spinner } from '@/shared/ui/primitives/spinner';
import { cn } from '@/shared/utils';

import { AguaProfunda, TIEMPOS, useIntro } from './intro';

const LETRAS = 'mangroove'.split('');

/** Home: the intro, then what Mangroove is in one screen and the two ways in. */
export function Inicio() {
	const { t } = useIdioma();
	const intro = useIntro();
	const { entra } = intro;

	const repetir = () => {
		document.getElementById('contenido')?.scrollTo(0, 0);
		intro.repetir();
	};

	return (
		<div
			key={intro.vuelta}
			className="relative isolate flex min-h-full flex-col overflow-hidden"
			onKeyDown={e => e.key === 'Escape' && intro.enCurso && intro.saltar()}
		>
			{/* The world is two screens tall: the mangrove on top, the water below. */}
			<div
				aria-hidden
				className={cn(
					'absolute inset-x-0 top-0 -z-10 h-[200%]',
					intro.enCurso && 'intro-camara'
				)}
			>
				<img
					src="/marca/escena-manglar.webp"
					alt=""
					className="absolute inset-x-0 top-0 h-1/2 w-full object-cover object-[50%_62%] select-none"
					draggable={false}
				/>
				{intro.enCurso && <AguaProfunda />}
			</div>
			{/* Paper wash behind the text block so the copy keeps its contrast over the drawing. */}
			<div
				aria-hidden
				{...entra(TIEMPOS.papel)}
				className="absolute inset-x-0 top-0 -z-10 h-[62%] bg-gradient-to-b from-[#f7f1e3] via-[#f7f1e3]/85 to-transparent"
			/>

			{intro.enCurso && (
				<button
					type="button"
					onClick={intro.saltar}
					className="boton boton-arena fixed right-4 bottom-4 z-20 shadow-lg"
				>
					<SkipForward className="size-4" aria-hidden />
					{t.inicio.saltar}
				</button>
			)}

			{/* Reaching the content with the keyboard ends the intro: nothing focusable stays hidden. */}
			<div
				className="flex flex-1 flex-col"
				onFocusCapture={() => intro.enCurso && intro.saltar()}
			>
				<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-5 pt-8 pb-10 text-center sm:pt-12">
					<p
						{...entra(TIEMPOS.evento)}
						className="font-titulo text-sm font-semibold tracking-[0.22em] text-manglar-oceano uppercase"
					>
						{t.inicio.evento}
					</p>

					<h1
						className="crayola mt-4 font-titulo text-[clamp(3.6rem,15vw,9.5rem)] leading-[0.9] font-bold tracking-tight text-manglar-verde lowercase"
						aria-label="Mangroove"
					>
						{LETRAS.map((letra, k) => (
							<span
								key={k}
								aria-hidden
								{...entra(TIEMPOS.titulo + k * TIEMPOS.letra)}
								className={cn(
									'inline-block',
									(k === 5 || k === 6) && 'text-manglar-olivo'
								)}
							>
								{letra}
							</span>
						))}
					</h1>

					<p
						{...entra(TIEMPOS.frase)}
						className="mt-5 max-w-2xl text-xl leading-relaxed text-balance text-manglar-verde sm:text-2xl"
					>
						{t.inicio.frase}
					</p>

					<div {...entra(TIEMPOS.isotipo)} className="relative mt-7">
						<Isotipo className="w-28 rounded-full shadow-lg sm:w-32" />
						<NotaMusical
							tipo="doble"
							className="absolute -top-2 -right-8 size-7 text-manglar-carmesi"
						/>
						<NotaMusical
							tipo="corchea"
							className="absolute top-10 -left-9 size-6 text-manglar-olivo"
						/>
					</div>

					<div
						{...entra(TIEMPOS.botones)}
						className="mt-7 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center"
					>
						<Link
							to="/historia"
							className="boton boton-primario min-h-12 px-7 text-lg shadow-md"
						>
							{t.inicio.historia}
						</Link>
						<Link
							to="/explorar"
							className="boton boton-contorno min-h-12 px-7 text-lg shadow-md"
						>
							{t.inicio.explorar}
						</Link>
					</div>

					<p
						{...entra(TIEMPOS.pie)}
						className="mt-6 font-titulo text-lg font-semibold tracking-wider text-manglar-papel [text-shadow:0_1px_6px_rgb(13_59_22/0.9)]"
					>
						{t.inicio.equipo}
					</p>
				</div>

				<div
					{...entra(TIEMPOS.pie)}
					className="flex flex-col items-start justify-between gap-3 px-4 pb-4 sm:flex-row sm:items-end"
				>
					<EstadoDatos />
					<div className="flex flex-col items-start gap-1 text-manglar-papel [text-shadow:0_1px_3px_rgb(0_0_0/0.9)] sm:items-end">
						{!intro.enCurso && intro.puedeRepetir && (
							<button
								type="button"
								onClick={repetir}
								className="inline-flex min-h-10 cursor-pointer items-center gap-2 font-medium underline underline-offset-4"
							>
								<RotateCcw className="size-4" aria-hidden />
								{t.inicio.repetir}
							</button>
						)}
						<CodigoAbiertoPie className="mt-1 [text-shadow:none]" />
						<p className="text-xs">{t.inicio.creditos}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

/** Honest status of the data behind the app: which version is published, or why there is none. */
function EstadoDatos() {
	const { t, fmt } = useIdioma();
	const sesion = useSesion();
	const m = sesion.manifiesto;

	return (
		<section aria-live="polite" className="panel max-w-sm space-y-1 px-4 py-3 text-sm">
			{sesion.estado === 'cargando' && (
				<p className="flex items-center gap-2">
					<Spinner className="size-4" />
					{t.estado.cargando}
				</p>
			)}
			{sesion.estado === 'lista' && m && (
				<>
					<h2 className="text-base font-semibold">{m.region.nombre}</h2>
					<p className="leading-snug">
						{t.inicio.datos(
							m.fechas.length,
							m.version,
							t.madurez(m.fuente.madurez),
							fmt.fechaLarga(m.generado, m.region.zona_horaria)
						)}
					</p>
					{sesion.origen === 'respaldo' && (
						<p className="etiqueta">{t.mapa.sinConexionDetalle}</p>
					)}
				</>
			)}
			{sesion.estado === 'error' && (
				<>
					<h2 className="text-base font-semibold">
						{t.estado.error[sesion.motivo ?? 'otro'].titulo}
					</h2>
					<p className="leading-snug">{t.inicio.sinDatos}</p>
					<button
						type="button"
						onClick={sesion.reintentar}
						className="inline-flex min-h-10 cursor-pointer items-center gap-2 font-medium underline underline-offset-4"
					>
						<RotateCw className="size-4" aria-hidden />
						{t.estado.reintentar}
					</button>
				</>
			)}
		</section>
	);
}
