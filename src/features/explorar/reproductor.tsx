import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { ReactNode } from 'react';

import { useIdioma } from '@/features/idioma/idioma';
import { Partitura, type DatosPartitura } from '@/features/partitura/partitura';
import { sonido, useSonido } from '@/features/partitura/sonido';
import { Spinner } from '@/shared/ui/primitives/spinner';
import { cn } from '@/shared/utils';

type Props = {
	manifiesto: DatosPartitura;
	seleccion: string | undefined;
	onSeleccion: (id: string) => void;
	comparacion?: string | null;
	modo?: 'pasada' | 'conectividad';
	sonando?: string | null;
	/** Transport controls; omitted where the score only gives context. */
	transporte?: {
		reproduciendo: boolean;
		onReproducir: () => void;
		onPaso: (delta: 1 | -1) => void;
	};
	nota?: ReactNode;
	className?: string;
};

/** The score with its transport: previous, play, next and sound. */
export function Reproductor({
	manifiesto,
	seleccion,
	onSeleccion,
	comparacion,
	modo,
	sonando,
	transporte,
	nota,
	className
}: Props) {
	const { t, fmt } = useIdioma();
	const audio = useSonido();
	const fechas = manifiesto.fechas;
	const zona = manifiesto.region.zona_horaria;
	const primera = fechas[0];
	const ultima = fechas[fechas.length - 1];

	return (
		<section
			aria-label={t.partitura.seccion}
			className={cn(
				'sobre-oscuro flex flex-col gap-2 rounded-[20px] border border-manglar-arena/50 bg-[#233e45]/88 p-3 text-manglar-papel backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4',
				className
			)}
		>
			<div className="flex shrink-0 flex-col gap-2 sm:w-44">
				<div className="flex items-center gap-2">
					{transporte && (
						<>
							<button
								type="button"
								className="control-mapa"
								aria-label={t.partitura.anterior}
								onClick={() => transporte.onPaso(-1)}
							>
								<SkipBack className="size-5" aria-hidden />
							</button>
							<button
								type="button"
								className="control-mapa bg-manglar-arena"
								aria-label={
									transporte.reproduciendo
										? t.partitura.pausar
										: t.partitura.reproducir
								}
								onClick={transporte.onReproducir}
							>
								{transporte.reproduciendo ? (
									<Pause className="size-5" aria-hidden />
								) : (
									<Play className="size-5" aria-hidden />
								)}
							</button>
							<button
								type="button"
								className="control-mapa"
								aria-label={t.partitura.siguiente}
								onClick={() => transporte.onPaso(1)}
							>
								<SkipForward className="size-5" aria-hidden />
							</button>
						</>
					)}
					<button
						type="button"
						className="control-mapa"
						aria-pressed={audio.activo}
						aria-label={
							audio.activo ? t.partitura.silenciar : t.partitura.activarSonido
						}
						title={audio.activo ? t.partitura.silenciar : t.partitura.activarSonido}
						onClick={() => void sonido.alternar()}
					>
						{audio.cargando ? (
							<Spinner className="size-5" />
						) : audio.activo ? (
							<Volume2 className="size-5" aria-hidden />
						) : (
							<VolumeX className="size-5" aria-hidden />
						)}
					</button>
				</div>
				<p className="text-sm leading-snug">
					{nota ??
						(primera && ultima
							? t.partitura.resumen(
									fechas.length,
									fmt.fechaCorta(primera.fecha_hora, zona),
									fmt.fechaLarga(ultima.fecha_hora, zona)
								)
							: t.partitura.vacia)}
				</p>
			</div>
			{fechas.length > 0 ? (
				<Partitura
					manifiesto={manifiesto}
					seleccion={seleccion}
					onSeleccion={onSeleccion}
					comparacion={comparacion}
					modo={modo}
					sonando={sonando}
					className="min-w-0 flex-1"
				/>
			) : (
				<p className="flex-1 py-6 text-center">{t.partitura.vacia}</p>
			)}
		</section>
	);
}
