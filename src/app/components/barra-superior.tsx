import { Link } from '@tanstack/react-router';
import { Check, ChevronDown, MapPin, Menu, Share2, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useSesion } from '@/features/datos/sesion';
import { useIdioma, type Idioma } from '@/features/idioma/idioma';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/shared/ui/primitives/dropdown-menu';
import { cn } from '@/shared/utils';

const RUTAS = [
	{ to: '/historia', clave: 'historia' },
	{ to: '/explorar', clave: 'explorar' },
	{ to: '/metodo', clave: 'metodo' }
] as const;

/** Copies the current address. The explore view keeps its whole state in the URL. */
function useCompartir() {
	const [copiado, setCopiado] = useState(false);
	useEffect(() => {
		if (!copiado) return;
		const id = window.setTimeout(() => setCopiado(false), 2400);
		return () => window.clearTimeout(id);
	}, [copiado]);

	const compartir = async () => {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			setCopiado(true);
		} catch {
			// Clipboard blocked (insecure origin, permissions): let the person copy it by hand.
			window.prompt('', url);
		}
	};
	return { copiado, compartir };
}

export function BarraSuperior() {
	const { t, idioma, setIdioma } = useIdioma();
	const sesion = useSesion();
	const { copiado, compartir } = useCompartir();
	const m = sesion.manifiesto;

	const estado =
		sesion.estado === 'lista' && m
			? t.barra.version(m.version, m.fuente.mision, t.madurez(m.fuente.madurez))
			: sesion.estado === 'cargando'
				? t.barra.cargando
				: t.barra.sinDatos;

	const regionActual = m?.region.nombre ?? t.barra.region;

	return (
		<header className="papel relative z-30 flex h-16 shrink-0 items-center gap-2 border-b-2 border-manglar-olivo px-3 sm:px-5">
			<Link
				to="/"
				aria-label={t.barra.inicio}
				className="mr-1 flex shrink-0 items-center rounded-lg sm:mr-3"
			>
				<img src="/marca/mangroove.svg" alt="" className="h-12 w-auto" />
			</Link>

			<nav aria-label={t.barra.navegacion} className="hidden items-center gap-1 lg:flex">
				{RUTAS.map(ruta => (
					<Link
						key={ruta.to}
						to={ruta.to}
						className="boton boton-fantasma min-h-10 px-4"
						activeProps={{ className: 'bg-manglar-arena', 'aria-current': 'page' }}
					>
						{t.nav[ruta.clave]}
					</Link>
				))}
			</nav>

			<DropdownMenu>
				<DropdownMenuTrigger
					className="boton boton-contorno ml-2 hidden min-h-10 max-w-60 px-4 lg:inline-flex"
					disabled={sesion.regiones.length === 0}
				>
					<MapPin className="size-4 shrink-0" aria-hidden />
					<span className="truncate">{regionActual}</span>
					<ChevronDown className="size-4 shrink-0" aria-hidden />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-64">
					<DropdownMenuLabel>{t.barra.elegirRegion}</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={m?.region.codigo ?? ''}
						onValueChange={codigo => sesion.abrir(codigo)}
					>
						{sesion.regiones.map(region => (
							<DropdownMenuRadioItem key={region.codigo} value={region.codigo}>
								{region.nombre}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
					<DropdownMenuSeparator />
					<p className="etiqueta px-2 py-1.5">{t.barra.soloPublicadas}</p>
				</DropdownMenuContent>
			</DropdownMenu>

			<div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
				{sesion.origen === 'respaldo' && (
					<span className="inline-flex items-center gap-1.5 rounded-md border border-warning-border bg-warning px-2 py-1 text-xs font-medium text-warning-foreground">
						<WifiOff className="size-3.5" aria-hidden />
						{t.barra.respaldo}
					</span>
				)}
				<p
					className="hidden truncate text-sm text-manglar-oceano md:block"
					aria-live="polite"
				>
					{estado}
				</p>

				<button
					type="button"
					onClick={compartir}
					className="boton boton-fantasma hidden min-h-10 px-3 lg:inline-flex"
				>
					{copiado ? (
						<Check className="size-4" aria-hidden />
					) : (
						<Share2 className="size-4" aria-hidden />
					)}
					<span aria-live="polite">{copiado ? t.barra.copiado : t.barra.compartir}</span>
				</button>

				<SelectorIdioma
					idioma={idioma}
					onCambio={setIdioma}
					etiqueta={t.barra.idioma}
					className="hidden lg:flex"
				/>

				<DropdownMenu>
					<DropdownMenuTrigger
						className="control-mapa shadow-none lg:hidden"
						aria-label={t.barra.menu}
					>
						<Menu className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-64">
						{RUTAS.map(ruta => (
							<DropdownMenuItem key={ruta.to} asChild className="min-h-11 text-base">
								<Link to={ruta.to}>{t.nav[ruta.clave]}</Link>
							</DropdownMenuItem>
						))}
						{sesion.regiones.length > 1 && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuLabel>{t.barra.elegirRegion}</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									value={m?.region.codigo ?? ''}
									onValueChange={codigo => sesion.abrir(codigo)}
								>
									{sesion.regiones.map(region => (
										<DropdownMenuRadioItem
											key={region.codigo}
											value={region.codigo}
											className="min-h-11"
										>
											{region.nombre}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="min-h-11 text-base" onSelect={compartir}>
							<Share2 className="size-4" aria-hidden />
							{t.barra.compartir}
						</DropdownMenuItem>
						<DropdownMenuItem
							className="min-h-11 text-base"
							onSelect={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
						>
							{t.barra.cambiarIdioma}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<p className="etiqueta px-2 py-1.5">{estado}</p>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}

function SelectorIdioma({
	idioma,
	onCambio,
	etiqueta,
	className
}: {
	idioma: Idioma;
	onCambio: (idioma: Idioma) => void;
	etiqueta: string;
	className?: string;
}) {
	return (
		<div
			role="group"
			aria-label={etiqueta}
			className={cn('rounded-full border-[1.5px] border-manglar-verde p-0.5', className)}
		>
			{(['es', 'en'] as const).map(codigo => (
				<button
					key={codigo}
					type="button"
					lang={codigo}
					aria-pressed={idioma === codigo}
					onClick={() => onCambio(codigo)}
					className={cn(
						'min-h-9 min-w-10 cursor-pointer rounded-full px-2.5 pt-0.5 font-titulo text-sm font-semibold uppercase transition-colors',
						idioma === codigo
							? 'bg-manglar-verde text-manglar-papel'
							: 'text-manglar-verde hover:bg-manglar-arena/60'
					)}
				>
					{codigo}
				</button>
			))}
		</div>
	);
}
