import { CircleCheck, CircleHelp, MapPinOff, TriangleAlert, X } from 'lucide-react';

import {
	aPorcentaje,
	estadoDeCelda,
	nombreDePais,
	unirSerie,
	type EstadoCelda
} from '@/features/datos/dominio';
import type { Celda, Manifiesto } from '@/features/datos/esquemas';
import { useIdioma } from '@/features/idioma/idioma';
import { Spinner } from '@/shared/ui/primitives/spinner';
import { cn } from '@/shared/utils';

import { GraficaSerie } from './grafica-serie';

/**
 * Inspector of one 1 ha cell: why it has the state it shows.
 *
 * Wording rules it enforces:
 *  - a possible disconnection is a hypothesis to verify in the field, never a
 *    cause, a culprit or the death of the mangrove;
 *  - "probabilidad de error" (of the classification) and "confianza del cambio"
 *    are different measures, shown in different places with different names;
 *  - a missing value is said in words, never drawn as 0 %.
 */

export type EstadoInspector =
	| { tipo: 'cargando' }
	| { tipo: 'sin-conexion' }
	| { tipo: 'error'; onReintentar: () => void }
	| { tipo: 'lista'; celda: Celda };

const SELLOS: Record<EstadoCelda, { icono: typeof X; clase: string }> = {
	desconectada: { icono: TriangleAlert, clase: 'bg-dato-aviso text-[#3a2a00]' },
	conectada: {
		icono: CircleCheck,
		clase: 'bg-success text-manglar-verde border border-manglar-olivo/50'
	},
	insuficiente: {
		icono: CircleHelp,
		clase: 'bg-manglar-papel-hondo text-manglar-oceano border border-manglar-oceano/40'
	},
	fuera: {
		icono: MapPinOff,
		clase: 'bg-manglar-papel-hondo text-manglar-oceano border border-manglar-oceano/40'
	}
};

export function Inspector({
	estado,
	manifiesto,
	onCerrar,
	className
}: {
	estado: EstadoInspector;
	manifiesto: Manifiesto;
	onCerrar: () => void;
	className?: string;
}) {
	const { t } = useIdioma();
	const celda = estado.tipo === 'lista' ? estado.celda : undefined;

	return (
		<aside aria-label={t.inspector.etiqueta} className={cn('flex flex-col', className)}>
			<div className="flex items-start justify-between gap-3">
				<h2 className="text-2xl font-semibold break-all" tabIndex={-1}>
					{celda ? t.inspector.titulo(celda.id) : t.inspector.tituloVacio}
				</h2>
				<button
					type="button"
					className="control-mapa -mt-1 -mr-1 size-10 shrink-0 shadow-none"
					aria-label={t.inspector.cerrar}
					onClick={onCerrar}
				>
					<X className="size-5" aria-hidden />
				</button>
			</div>

			{estado.tipo === 'cargando' && (
				<p role="status" className="flex items-center gap-3 py-8">
					<Spinner className="size-5" />
					{t.inspector.cargando}
				</p>
			)}
			{estado.tipo === 'sin-conexion' && (
				<p role="status" className="py-6 leading-relaxed">
					{t.inspector.sinConexion}
				</p>
			)}
			{estado.tipo === 'error' && (
				<div role="alert" className="space-y-4 py-6">
					<p className="leading-relaxed">{t.inspector.error}</p>
					<button
						type="button"
						className="boton boton-contorno"
						onClick={estado.onReintentar}
					>
						{t.estado.reintentar}
					</button>
				</div>
			)}
			{celda && <Contenido celda={celda} manifiesto={manifiesto} />}
		</aside>
	);
}

function Contenido({ celda, manifiesto }: { celda: Celda; manifiesto: Manifiesto }) {
	const { t, fmt, idioma } = useIdioma();
	const estado = estadoDeCelda(celda);
	const sello = SELLOS[estado];
	const Icono = sello.icono;
	const m = celda.metricas;
	const zona = manifiesto.region.zona_horaria;
	const serie = unirSerie(celda, manifiesto.fechas);
	const pais = nombreDePais(celda.pais, idioma);
	const hectareas = manifiesto.region.grilla.celda_m ** 2 / 10_000;
	const minimo = manifiesto.umbrales.min_fechas_alta;
	const ifAlta = aPorcentaje(m?.if_alta);
	const ifTotal = aPorcentaje(m?.if);
	const fechaCambio = celda.cambio
		? manifiesto.fechas.find(f => f.id === celda.cambio!.fecha_id)
		: undefined;

	return (
		<div className="aparecer space-y-5 pt-1">
			<p className="etiqueta">
				{[
					`${fmt.numero(hectareas, hectareas % 1 ? 1 : 0)} ha`,
					fmt.coordenadas(celda.centroide[0], celda.centroide[1]),
					pais
				]
					.filter(Boolean)
					.join(', ')}
			</p>

			<p
				className={cn(
					'inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 font-medium',
					sello.clase
				)}
			>
				<Icono className="size-4 shrink-0" aria-hidden />
				{t.inspector.estados[estado].sello}
			</p>

			<p className="text-lg leading-relaxed">
				{estado === 'desconectada' || estado === 'conectada'
					? t.inspector.estados[estado].frase(fmt.porcentaje(m!.if_alta!))
					: estado === 'insuficiente'
						? t.inspector.estados.insuficiente.frase(
								m?.n_fechas_alta ?? null,
								minimo ?? null
							)
						: t.inspector.estados.fuera.frase}
			</p>

			{m && (
				<>
					<dl className="grid grid-cols-2 gap-4">
						<div>
							<dt className="etiqueta">{t.campos.ifAlta}</dt>
							<dd>
								<span className="block font-titulo text-4xl leading-tight font-bold tabular-nums">
									{ifAlta === null
										? t.inspector.sinConclusion
										: `${fmt.numero(ifAlta)} %`}
								</span>
								<span className="block text-sm leading-snug">
									{t.inspector.conPasadasAlta(m.n_fechas_alta, minimo ?? null)}
								</span>
							</dd>
						</div>
						<div>
							<dt className="etiqueta">{t.campos.ifTotal}</dt>
							<dd>
								<span className="block font-titulo text-4xl leading-tight font-bold tabular-nums">
									{ifTotal === null
										? t.comun.sinDato
										: `${fmt.numero(ifTotal)} %`}
								</span>
								<span className="block text-sm leading-snug">
									{t.inspector.conPasadas(m.n_fechas)}
								</span>
							</dd>
						</div>
					</dl>
					<p>
						{t.campos.pError}:{' '}
						<strong className="tabular-nums">
							{m.p_error === null ? t.comun.sinDato : fmt.porcentaje(m.p_error)}
						</strong>
					</p>
				</>
			)}

			{celda.en_mascara && (
				<section className="tarjeta space-y-1.5 p-4">
					<h3 className="text-base font-semibold">
						{celda.cambio ? t.inspector.cambio.titulo : t.inspector.cambio.sinCambio}
					</h3>
					{celda.cambio ? (
						<>
							<p className="leading-relaxed">
								{t.inspector.cambio.frase(
									celda.cambio.delta_hv_db === null
										? null
										: fmt.decibeles(Math.abs(celda.cambio.delta_hv_db)),
									fechaCambio
										? fmt.fechaLarga(fechaCambio.fecha_hora, zona)
										: celda.cambio.fecha_id
								)}{' '}
								{t.campos.confianza}:{' '}
								<strong className="tabular-nums">
									{celda.cambio.confianza === null
										? t.comun.sinDato
										: fmt.porcentaje(celda.cambio.confianza)}
								</strong>
								.
							</p>
							<p className="etiqueta">{t.inspector.cambio.distintas}</p>
						</>
					) : (
						<p className="etiqueta">{t.inspector.cambio.sinCambioAyuda}</p>
					)}
				</section>
			)}

			<section className="space-y-2">
				<h3 className="text-base font-semibold">{t.inspector.serie}</h3>
				{serie.length > 0 ? (
					<GraficaSerie serie={serie} cambio={celda.cambio} manifiesto={manifiesto} />
				) : (
					<p className="etiqueta">{t.inspector.sinSerie}</p>
				)}
			</section>

			<p className="etiqueta border-t border-manglar-olivo/30 pt-3">
				{t.inspector.hipotesis}
			</p>
		</div>
	);
}
