import { CloudOff, Compass, FileWarning, RotateCw, Unplug } from 'lucide-react';
import type { ReactNode } from 'react';

import { useIdioma } from '@/features/idioma/idioma';
import { Spinner } from '@/shared/ui/primitives/spinner';
import { cn } from '@/shared/utils';

import { useSesion } from './sesion';

const ICONOS = {
	'sin-conexion': CloudOff,
	retirada: Unplug,
	'no-encontrada': Compass,
	formato: FileWarning,
	otro: FileWarning
} as const;

/**
 * What a screen shows while the data session is not ready: loading, or the
 * reason there is no data with what the person can do about it. The app never
 * fills these states with invented data.
 */
export function EstadoSesion({ className, oscuro }: { className?: string; oscuro?: boolean }) {
	const { t } = useIdioma();
	const sesion = useSesion();

	if (sesion.estado === 'lista') return null;

	if (sesion.estado === 'cargando') {
		return (
			<Marco className={className} oscuro={oscuro}>
				<Spinner className="size-7" />
				<p role="status" className="text-lg">
					{t.estado.cargando}
				</p>
			</Marco>
		);
	}

	const motivo = sesion.motivo ?? 'otro';
	const Icono = ICONOS[motivo];
	const texto = t.estado.error[motivo];

	return (
		<Marco className={className} oscuro={oscuro}>
			<Icono className="size-10" aria-hidden />
			<div role="alert" className="max-w-md space-y-2">
				<h2 className="text-2xl font-semibold">{texto.titulo}</h2>
				<p className="text-base leading-relaxed opacity-90">{texto.detalle}</p>
			</div>
			<div className="flex flex-wrap justify-center gap-3">
				{motivo === 'retirada' ? (
					<button
						type="button"
						className="boton boton-arena"
						onClick={sesion.abrirVigente}
					>
						{t.estado.abrirVigente}
					</button>
				) : (
					<button type="button" className="boton boton-arena" onClick={sesion.reintentar}>
						<RotateCw className="size-4" aria-hidden />
						{t.estado.reintentar}
					</button>
				)}
			</div>
		</Marco>
	);
}

function Marco({
	children,
	className,
	oscuro
}: {
	children: ReactNode;
	className?: string;
	oscuro?: boolean;
}) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-5 p-8 text-center',
				oscuro ? 'sobre-oscuro bg-manglar-noche text-manglar-papel' : 'text-manglar-verde',
				className
			)}
		>
			{children}
		</div>
	);
}
