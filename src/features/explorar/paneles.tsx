import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Download, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
	urlResumenCsv,
	type ClaseEstanque,
	type Contexto,
	type OrdenEstanques
} from '@/features/datos/api';
import {
	excluidaPorLluvia,
	mismaGeometria,
	nombreDePais,
	sinMarea
} from '@/features/datos/dominio';
import type { Estanque, Fecha, Manifiesto } from '@/features/datos/esquemas';
import { datos } from '@/features/datos/servicio';
import { useIdioma } from '@/features/idioma/idioma';
import { Spinner } from '@/shared/ui/primitives/spinner';
import { cn } from '@/shared/utils';

import { LeyendaClases, LeyendaDesconexion, LeyendaFrecuencia, LeyendaRgb } from './leyendas';

/** Content of the side panel for each explore mode. Panels only present; state lives in `explorar.tsx`. */

export function Encabezado({ titulo, children }: { titulo: string; children: ReactNode }) {
	return (
		<header className="space-y-2">
			<h1 className="crayola-suave text-[1.7rem] font-semibold">{titulo}</h1>
			<p className="leading-relaxed">{children}</p>
		</header>
	);
}

export function Segmentos<T extends string>({
	valor,
	opciones,
	onCambio,
	etiqueta
}: {
	valor: T;
	opciones: { valor: T; texto: string }[];
	onCambio: (valor: T) => void;
	etiqueta: string;
}) {
	return (
		<div
			role="group"
			aria-label={etiqueta}
			className="tarjeta inline-flex flex-wrap gap-1 self-start p-1"
		>
			{opciones.map(opcion => (
				<button
					key={opcion.valor}
					type="button"
					aria-pressed={valor === opcion.valor}
					onClick={() => onCambio(opcion.valor)}
					className={cn(
						'min-h-10 cursor-pointer rounded-[11px] px-3.5 pt-0.5 font-titulo transition-colors',
						valor === opcion.valor
							? 'bg-manglar-oceano text-manglar-papel'
							: 'hover:bg-manglar-arena/70'
					)}
				>
					{opcion.texto}
				</button>
			))}
		</div>
	);
}

function Aviso({ children, titulo }: { children: ReactNode; titulo?: string }) {
	return (
		<div
			role="note"
			className="flex gap-2.5 rounded-xl border border-warning-border bg-warning p-3 text-warning-foreground"
		>
			<TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
			<div className="min-w-0 space-y-0.5 leading-snug">
				{titulo && <p className="font-semibold">{titulo}</p>}
				<p>{children}</p>
			</div>
		</div>
	);
}

/** Local date, orbit and estimated tide of one pass. */
export function TarjetaPasada({
	fecha,
	manifiesto,
	letra,
	activa,
	onElegir
}: {
	fecha: Fecha;
	manifiesto: Manifiesto;
	letra?: 'A' | 'B';
	activa?: boolean;
	onElegir?: () => void;
}) {
	const { t, fmt } = useIdioma();
	const zona = manifiesto.region.zona_horaria;
	const lluvia = excluidaPorLluvia(fecha, manifiesto);
	const contenido = (
		<>
			<p className="flex items-center gap-2 font-titulo text-2xl font-semibold">
				{letra && (
					<span className="inline-flex size-7 items-center justify-center rounded-md bg-manglar-verde pt-0.5 text-base text-manglar-papel">
						{letra}
					</span>
				)}
				{fmt.fechaLarga(fecha.fecha_hora, zona)}
			</p>
			<p className="mt-1">
				{t.pasada.hora(fmt.hora(fecha.fecha_hora, zona), manifiesto.region.nombre)}
			</p>
			<dl className="mt-2 space-y-2">
				<div>
					<dt className="etiqueta">{t.pasada.orbita}</dt>
					<dd>{t.orbitaLarga(fecha.orbita)}</dd>
				</div>
				<div>
					<dt className="etiqueta">{t.pasada.marea}</dt>
					<dd>
						{fecha.marea_m === null
							? t.partitura.sinEstimacion
							: t.pasada.mareaValor(
									fmt.metros(fecha.marea_m),
									t.nivelMarea[fecha.marea_nivel]
								)}
					</dd>
				</div>
			</dl>
			{lluvia && fecha.lluvia_3d_mm !== null && (
				<p className="etiqueta mt-2">{t.pasada.lluvia(fmt.numero(fecha.lluvia_3d_mm))}</p>
			)}
		</>
	);
	const clases = cn('tarjeta block w-full p-4 text-left', activa && 'ring-2 ring-manglar-verde');
	return onElegir ? (
		<button
			type="button"
			aria-pressed={activa}
			onClick={onElegir}
			className={cn(clases, 'cursor-pointer')}
		>
			{contenido}
			<span className="etiqueta mt-2 block">
				{activa ? t.comparar.eligiendo(letra!) : t.comparar.cambiar(letra!)}
			</span>
		</button>
	) : (
		<div className={clases}>{contenido}</div>
	);
}

export function PanelRitmo({
	manifiesto,
	fecha,
	fechaB,
	capa,
	onCapa,
	comparando,
	objetivo,
	onObjetivo,
	onComparar,
	reproduciendo
}: {
	manifiesto: Manifiesto;
	fecha: Fecha | undefined;
	fechaB: Fecha | undefined;
	capa: 'rgb' | 'clases';
	onCapa: (capa: 'rgb' | 'clases') => void;
	comparando: boolean;
	objetivo: 'A' | 'B';
	onObjetivo: (objetivo: 'A' | 'B') => void;
	onComparar: (activar: boolean) => void;
	reproduciendo: boolean;
}) {
	const { t } = useIdioma();

	if (!fecha) {
		return (
			<>
				<Encabezado titulo={t.ritmo.titulo}>{t.ritmo.sinPasadas}</Encabezado>
			</>
		);
	}

	const selector = (
		<Segmentos
			etiqueta={t.ritmo.capa}
			valor={capa}
			onCambio={onCapa}
			opciones={[
				{ valor: 'rgb', texto: t.ritmo.rgb },
				{ valor: 'clases', texto: t.ritmo.clases }
			]}
		/>
	);

	if (comparando) {
		return (
			<>
				<Encabezado titulo={t.comparar.titulo}>{t.comparar.intro}</Encabezado>
				<button
					type="button"
					className="boton boton-contorno self-start"
					onClick={() => onComparar(false)}
				>
					{t.comparar.salir}
				</button>
				<TarjetaPasada
					fecha={fecha}
					manifiesto={manifiesto}
					letra="A"
					activa={objetivo === 'A'}
					onElegir={() => onObjetivo('A')}
				/>
				{fechaB && (
					<TarjetaPasada
						fecha={fechaB}
						manifiesto={manifiesto}
						letra="B"
						activa={objetivo === 'B'}
						onElegir={() => onObjetivo('B')}
					/>
				)}
				{fechaB && !mismaGeometria(fecha, fechaB) && (
					<Aviso titulo={t.comparar.orbitasDistintas}>
						{t.comparar.orbitasDistintasDetalle}
					</Aviso>
				)}
				{selector}
				{capa === 'rgb' ? <LeyendaRgb /> : <LeyendaClases manifiesto={manifiesto} />}
			</>
		);
	}

	return (
		<>
			<Encabezado titulo={t.ritmo.titulo}>
				{reproduciendo ? t.ritmo.introReproduccion : t.ritmo.intro}
			</Encabezado>
			<TarjetaPasada fecha={fecha} manifiesto={manifiesto} />
			{selector}
			{capa === 'rgb' ? <LeyendaRgb /> : <LeyendaClases manifiesto={manifiesto} />}
			<button
				type="button"
				className="boton boton-contorno self-start"
				disabled={manifiesto.fechas.length < 2}
				onClick={() => onComparar(true)}
			>
				<ArrowLeftRight className="size-4" aria-hidden />
				{t.ritmo.comparar}
			</button>
		</>
	);
}

export function PanelSintonia({
	manifiesto,
	ctx,
	solo,
	onSolo,
	filtroDisponible
}: {
	manifiesto: Manifiesto;
	ctx: Contexto;
	solo: boolean;
	onSolo: (solo: boolean) => void;
	filtroDisponible: boolean;
}) {
	const { t } = useIdioma();
	const faltaMarea = sinMarea(manifiesto);

	return (
		<>
			<Encabezado titulo={t.sintonia.titulo}>{t.sintonia.intro}</Encabezado>
			{faltaMarea ? (
				<Aviso titulo={t.sintonia.sinMarea}>{t.sintonia.sinMareaDetalle}</Aviso>
			) : (
				<label className="flex min-h-11 cursor-pointer items-center gap-3">
					<input
						type="checkbox"
						role="switch"
						checked={solo}
						onChange={e => onSolo(e.target.checked)}
						className="peer sr-only"
					/>
					<span
						aria-hidden
						className="relative h-7 w-12 shrink-0 rounded-full border-2 border-manglar-verde bg-transparent transition-colors peer-checked:bg-manglar-verde peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--manglar-olivo)] after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-[var(--manglar-verde)] after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-[var(--manglar-arena)]"
					/>
					<span className="font-medium">{t.sintonia.solo}</span>
				</label>
			)}
			{solo && !faltaMarea ? (
				<>
					<LeyendaDesconexion
						manifiesto={manifiesto}
						soloDesconexion={filtroDisponible}
					/>
					<p className="etiqueta">
						{filtroDisponible ? t.sintonia.soloAyuda : t.sintonia.soloSinFiltro}
					</p>
				</>
			) : (
				<LeyendaFrecuencia manifiesto={manifiesto} capa={faltaMarea ? 'if' : 'if_alta'} />
			)}
			<ResumenPais ctx={ctx} />
		</>
	);
}

/** Hectares by country, straight from the summary of the version. */
function ResumenPais({ ctx }: { ctx: Contexto }) {
	const { t, fmt, idioma } = useIdioma();
	const resumen = useQuery(datos.resumen(ctx));
	const [pais, setPais] = useState<string | undefined>();

	if (resumen.isPending) {
		return (
			<p role="status" className="etiqueta flex items-center gap-2">
				<Spinner className="size-4" />
				{t.resumen.cargando}
			</p>
		);
	}
	if (resumen.isError) return <p className="etiqueta">{t.resumen.error}</p>;

	const paises = resumen.data.paises;
	if (paises.length === 0) return <p className="etiqueta">{t.resumen.vacio}</p>;
	// The API reports the whole region under an empty country code.
	const fila = paises.find(p => p.pais === (pais ?? paises[0]!.pais)) ?? paises[0]!;
	const nombre = (codigo: string) =>
		codigo === '' ? t.resumen.region : (nombreDePais(codigo, idioma) ?? codigo);
	const proporcion = fila.ha_manglar > 0 ? fila.ha_desconectada / fila.ha_manglar : null;

	return (
		<section className="tarjeta space-y-3 p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-base font-semibold">{t.resumen.titulo}</h3>
				{paises.length > 1 && (
					<select
						aria-label={t.resumen.pais}
						value={fila.pais}
						onChange={e => setPais(e.target.value)}
						className="min-h-10 rounded-full border-[1.5px] border-manglar-verde bg-transparent px-3"
					>
						{paises.map(p => (
							<option key={p.pais} value={p.pais}>
								{nombre(p.pais)}
							</option>
						))}
					</select>
				)}
			</div>
			<dl className="space-y-2">
				<div className="flex items-baseline justify-between gap-3">
					<dt>{t.resumen.manglar}</dt>
					<dd className="font-semibold tabular-nums">{fmt.hectareas(fila.ha_manglar)}</dd>
				</div>
				<div className="flex items-baseline justify-between gap-3">
					<dt>{t.resumen.desconectada}</dt>
					<dd className="text-right font-semibold tabular-nums">
						{fmt.hectareas(fila.ha_desconectada)}
						{proporcion !== null && (
							<span className="etiqueta block font-normal">
								{t.resumen.delManglar(fmt.porcentaje(proporcion))}
							</span>
						)}
					</dd>
				</div>
				<div className="flex items-baseline justify-between gap-3">
					<dt>{t.resumen.insuficiente}</dt>
					<dd className="font-semibold tabular-nums">
						{fmt.hectareas(fila.ha_insuficiente)}
					</dd>
				</div>
				{fila.ha_perdida_copa != null && (
					<div className="flex items-baseline justify-between gap-3">
						<dt>{t.resumen.perdidaCopa}</dt>
						<dd className="font-semibold tabular-nums">
							{fmt.hectareas(fila.ha_perdida_copa)}
						</dd>
					</div>
				)}
			</dl>
			<a
				href={urlResumenCsv(ctx)}
				className="inline-flex min-h-10 items-center gap-2 font-medium underline underline-offset-4"
				download
			>
				<Download className="size-4" aria-hidden />
				{t.resumen.csv}
			</a>
		</section>
	);
}

export function PanelEstanques({
	estanques,
	estado,
	clase,
	orden,
	onClase,
	onOrden,
	seleccion,
	onSeleccion
}: {
	estanques: Estanque[] | undefined;
	estado: 'cargando' | 'error' | 'lista';
	clase: ClaseEstanque;
	orden: OrdenEstanques;
	onClase: (clase: ClaseEstanque) => void;
	onOrden: (orden: OrdenEstanques) => void;
	seleccion: string | undefined;
	onSeleccion: (codigo: string) => void;
}) {
	const { t, fmt } = useIdioma();
	return (
		<>
			<Encabezado titulo={t.estanques.titulo}>{t.estanques.intro}</Encabezado>
			<Segmentos
				etiqueta={t.estanques.filtro}
				valor={clase}
				onCambio={onClase}
				opciones={[
					{ valor: '', texto: t.estanques.todos },
					{ valor: 'abandonado', texto: t.estanques.abandonados },
					{ valor: 'activo', texto: t.estanques.activos }
				]}
			/>
			<label className="flex flex-wrap items-center gap-2">
				<span className="etiqueta">{t.estanques.ordenar}</span>
				<select
					value={orden}
					onChange={e => onOrden(e.target.value as OrdenEstanques)}
					className="min-h-10 rounded-full border-[1.5px] border-manglar-verde bg-transparent px-3"
				>
					{(['puntaje', 'area', 'distancia', 'inundacion'] as const).map(o => (
						<option key={o} value={o}>
							{t.estanques.ordenes[o]}
						</option>
					))}
				</select>
			</label>

			{estado === 'cargando' && (
				<p role="status" className="flex items-center gap-2">
					<Spinner className="size-4" />
					{t.estanques.cargando}
				</p>
			)}
			{estado === 'error' && <p role="alert">{t.estanques.error}</p>}
			{estado === 'lista' && estanques?.length === 0 && <p>{t.estanques.vacio}</p>}

			{estado === 'lista' && estanques && estanques.length > 0 && (
				<ol className="space-y-2" aria-label={t.estanques.lista(estanques.length)}>
					{estanques.map((e, k) => (
						<li key={e.codigo}>
							<button
								type="button"
								aria-pressed={seleccion === e.codigo}
								onClick={() => onSeleccion(e.codigo)}
								className={cn(
									'tarjeta block w-full cursor-pointer p-3 text-left transition-shadow',
									seleccion === e.codigo && 'ring-2 ring-manglar-verde'
								)}
							>
								<span className="flex items-baseline justify-between gap-2">
									<span className="font-titulo text-lg font-semibold">
										{k + 1}. {e.codigo}
									</span>
									<span
										className={cn(
											'rounded-md px-2 py-0.5 text-sm font-medium',
											e.activo
												? 'bg-info text-info-foreground'
												: 'bg-warning text-warning-foreground'
										)}
									>
										{e.activo ? t.estanques.activo : t.estanques.abandonado}
									</span>
								</span>
								<span className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm">
									<span>
										{t.estanques.area}:{' '}
										<strong className="tabular-nums">
											{fmt.numero(e.area_ha, 1)} ha
										</strong>
									</span>
									<span>
										{t.estanques.canal}:{' '}
										<strong className="tabular-nums">
											{e.dist_canal_km === null
												? t.comun.sinDato
												: `${fmt.numero(e.dist_canal_km, 1)} km`}
										</strong>
									</span>
									<span>
										{t.estanques.vecino}:{' '}
										<strong className="tabular-nums">
											{e.if_vecino === null
												? t.comun.sinDato
												: fmt.porcentaje(e.if_vecino)}
										</strong>
									</span>
									<span>
										{t.estanques.puntaje}:{' '}
										<strong className="tabular-nums">
											{e.puntaje === null
												? t.estanques.sinPuntaje
												: fmt.numero(e.puntaje, 2)}
										</strong>
									</span>
								</span>
							</button>
						</li>
					))}
				</ol>
			)}
			<p className="etiqueta">{t.estanques.nota}</p>
		</>
	);
}
