import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Download, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Contexto } from '@/features/datos/api';
import type { Hipotesis, Manifiesto } from '@/features/datos/esquemas';
import { EstadoSesion } from '@/features/datos/estado-sesion';
import { datos } from '@/features/datos/servicio';
import { useSesion } from '@/features/datos/sesion';
import { useIdioma } from '@/features/idioma/idioma';
import { CodigoAbierto } from '@/features/marca/codigo-abierto';
import { Spinner } from '@/shared/ui/primitives/spinner';

/**
 * Method and data: what is measured, where each input comes from, the
 * thresholds of this version, the hypothesis tests, the downloads and the
 * credits. The explanations are fixed text; every figure comes from the loaded
 * version, so the page can never describe a run other than the one on the map.
 */

const SECCIONES = [
	'mide',
	'fuentes',
	'clasifica',
	'umbrales',
	'supuestos',
	'limitaciones',
	'hipotesis',
	'procedencia',
	'descargas',
	'creditos'
] as const;

export function Metodo() {
	const { t } = useIdioma();
	const sesion = useSesion();

	return (
		<div className="papel min-h-full">
			<div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[13rem_1fr] lg:py-14">
				<nav aria-label={t.metodo.enEstaPagina} className="hidden lg:block">
					<div className="sticky top-8 space-y-2">
						<p className="etiqueta font-semibold">{t.metodo.enEstaPagina}</p>
						<ul className="space-y-1.5">
							{SECCIONES.map(id => (
								<li key={id}>
									<a
										href={`#${id}`}
										className="hover:underline hover:underline-offset-4"
									>
										{t.metodo.secciones[id]}
									</a>
								</li>
							))}
						</ul>
					</div>
				</nav>

				<div className="max-w-3xl space-y-12">
					<h1 className="crayola text-[clamp(2.6rem,7vw,4.2rem)] font-bold">
						{t.metodo.titulo}
					</h1>

					<Seccion id="mide">
						<p>{t.metodo.mide}</p>
					</Seccion>

					<Seccion id="fuentes">
						<p>{t.metodo.fuentes}</p>
						{sesion.ctx && <Fuentes ctx={sesion.ctx} />}
					</Seccion>

					<Seccion id="clasifica">
						<p>{t.metodo.clasifica}</p>
					</Seccion>

					<Seccion id="umbrales">
						{sesion.manifiesto ? (
							<Umbrales manifiesto={sesion.manifiesto} />
						) : (
							<EstadoSesion className="items-start p-0 text-left" />
						)}
					</Seccion>

					<Seccion id="supuestos">
						<ul className="list-disc space-y-1.5 pl-5">
							{t.metodo.supuestos.map(s => (
								<li key={s}>{s}</li>
							))}
						</ul>
					</Seccion>

					<Seccion id="limitaciones">
						<ul className="list-disc space-y-1.5 pl-5">
							{t.metodo.limitaciones.map(s => (
								<li key={s}>{s}</li>
							))}
						</ul>
					</Seccion>

					<Seccion id="hipotesis">
						<p>{t.metodo.hipotesisIntro}</p>
						{sesion.ctx ? <PruebasDeHipotesis ctx={sesion.ctx} /> : <SinVersion />}
					</Seccion>

					<Seccion id="procedencia">
						{sesion.manifiesto && sesion.ctx ? (
							<Procedencia manifiesto={sesion.manifiesto} ctx={sesion.ctx} />
						) : (
							<SinVersion />
						)}
					</Seccion>

					<Seccion id="descargas">
						<p>{t.metodo.descargasIntro}</p>
						{sesion.ctx ? <Descargas ctx={sesion.ctx} /> : <SinVersion />}
					</Seccion>

					<Seccion id="creditos">
						<p>{t.metodo.creditos}</p>
						<CodigoAbierto className="max-w-xl" />
					</Seccion>

					<Link to="/explorar" className="boton boton-primario">
						{t.metodo.volver}
					</Link>
				</div>
			</div>
		</div>
	);
}

function Seccion({ id, children }: { id: (typeof SECCIONES)[number]; children: ReactNode }) {
	const { t } = useIdioma();
	return (
		<section
			id={id}
			aria-labelledby={`${id}-titulo`}
			className="scroll-mt-6 space-y-4 text-lg leading-relaxed"
		>
			<h2 id={`${id}-titulo`} className="text-3xl font-semibold">
				{t.metodo.secciones[id]}
			</h2>
			{children}
		</section>
	);
}

function SinVersion() {
	const { t } = useIdioma();
	return <p className="etiqueta text-base">{t.metodo.sinVersion}</p>;
}

function Cargando() {
	const { t } = useIdioma();
	return (
		<p role="status" className="flex items-center gap-2 text-base">
			<Spinner className="size-4" />
			{t.estado.cargando}
		</p>
	);
}

function Umbrales({ manifiesto }: { manifiesto: Manifiesto }) {
	const { t, fmt } = useIdioma();
	const u = manifiesto.umbrales;
	const filas: [string, string | undefined][] = [
		[
			t.metodo.umbrales.aguaAbierta,
			u.ow_hh_db !== undefined && u.ow_hv_db !== undefined
				? t.metodo.umbrales.aguaAbiertaValor(
						fmt.decibeles(u.ow_hh_db),
						fmt.decibeles(u.ow_hv_db)
					)
				: undefined
		],
		[
			t.metodo.umbrales.inundada,
			u.iv_hh_db !== undefined && u.iv_ratio_db !== undefined
				? t.metodo.umbrales.inundadaValor(
						fmt.decibeles(u.iv_hh_db),
						fmt.decibeles(u.iv_ratio_db)
					)
				: undefined
		],
		[
			t.metodo.umbrales.mareaAlta,
			u.marea_alta_m !== undefined
				? t.metodo.umbrales.desde(fmt.metros(u.marea_alta_m))
				: undefined
		],
		[
			t.metodo.umbrales.mareaBaja,
			u.marea_baja_m !== undefined
				? t.metodo.umbrales.hasta(fmt.metros(u.marea_baja_m))
				: undefined
		],
		[
			t.metodo.umbrales.lluvia,
			u.lluvia_max_mm !== undefined
				? t.metodo.umbrales.lluviaValor(fmt.numero(u.lluvia_max_mm))
				: undefined
		],
		[
			t.metodo.umbrales.desconexion,
			u.if_alta_desconectada !== undefined
				? t.metodo.umbrales.desconexionValor(fmt.porcentaje(u.if_alta_desconectada))
				: undefined
		],
		[
			t.metodo.umbrales.minimo,
			u.min_fechas_alta !== undefined ? fmt.numero(u.min_fechas_alta) : undefined
		],
		[
			t.metodo.umbrales.cambio,
			u.cusum_confianza !== undefined && u.cusum_perdida_db !== undefined
				? t.metodo.umbrales.cambioValor(
						fmt.porcentaje(u.cusum_confianza),
						fmt.decibeles(u.cusum_perdida_db)
					)
				: undefined
		]
	];
	return (
		<>
			<p>{t.metodo.umbrales.perfil(u.perfil, u.version)}</p>
			<dl className="divide-y divide-manglar-olivo/30">
				{filas
					.filter((fila): fila is [string, string] => fila[1] !== undefined)
					.map(([nombre, valor]) => (
						<div
							key={nombre}
							className="grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4"
						>
							<dt className="font-medium">{nombre}</dt>
							<dd>{valor}</dd>
						</div>
					))}
			</dl>
		</>
	);
}

function Fuentes({ ctx }: { ctx: Contexto }) {
	const { t } = useIdioma();
	const metodo = useQuery(datos.metodo(ctx));
	if (metodo.isPending) return <Cargando />;
	if (metodo.isError) return <p className="etiqueta text-base">{t.metodo.errorSeccion}</p>;
	const { insumos, modelo_marea, fuente_lluvia, productos } = metodo.data;
	return (
		<>
			<p>
				{t.metodo.productos(productos.length)}
				{modelo_marea ? ` ${t.metodo.modeloMarea(modelo_marea)}` : ''}
				{fuente_lluvia ? ` ${t.metodo.fuenteLluvia(fuente_lluvia)}` : ''}
			</p>
			{insumos.length > 0 && (
				<ul className="divide-y divide-manglar-olivo/30">
					{insumos.map(insumo => (
						<li key={`${insumo.tipo}-${insumo.version ?? ''}`} className="py-2.5">
							<p className="font-medium">
								{t.metodo.insumos[insumo.tipo as keyof typeof t.metodo.insumos] ??
									insumo.tipo}
								{insumo.version ? ` · ${insumo.version}` : ''}
							</p>
							<p className="text-base">
								{insumo.fuente_url ? (
									<a
										href={insumo.fuente_url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 underline underline-offset-4"
									>
										{insumo.fuente ?? insumo.fuente_url}
										<ExternalLink className="size-3.5" aria-hidden />
									</a>
								) : (
									insumo.fuente
								)}
								{insumo.licencia
									? ` · ${t.metodo.licencia}: ${insumo.licencia}`
									: ''}
							</p>
						</li>
					))}
				</ul>
			)}
		</>
	);
}

function PruebasDeHipotesis({ ctx }: { ctx: Contexto }) {
	const { t } = useIdioma();
	const hipotesis = useQuery(datos.hipotesis(ctx));
	if (ctx.origen === 'respaldo')
		return <p className="etiqueta text-base">{t.metodo.sinConexion}</p>;
	if (hipotesis.isPending) return <Cargando />;
	if (hipotesis.isError) return <p className="etiqueta text-base">{t.metodo.errorSeccion}</p>;
	if (hipotesis.data.length === 0)
		return <p className="etiqueta text-base">{t.metodo.sinHipotesis}</p>;
	return (
		<ul className="space-y-3">
			{hipotesis.data.map(h => (
				<Prueba key={h.codigo} h={h} />
			))}
		</ul>
	);
}

function Prueba({ h }: { h: Hipotesis }) {
	const { t, fmt } = useIdioma();
	const pregunta = t.metodo.preguntas[h.codigo as keyof typeof t.metodo.preguntas];
	const grupo = (
		nombre: string | null | undefined,
		n: number | null | undefined,
		mediana: number | null | undefined
	) => t.metodo.grupo(nombre ?? '—', n ?? null, mediana == null ? null : fmt.numero(mediana, 2));
	return (
		<li className="tarjeta space-y-1.5 p-4 text-base">
			<h3 className="text-lg font-semibold">
				{h.codigo}
				{pregunta ? ` · ${pregunta}` : ''}
			</h3>
			{h.evaluable ? (
				<>
					<p>{grupo(h.grupo_a, h.n_a, h.mediana_a)}</p>
					<p>{grupo(h.grupo_b, h.n_b, h.mediana_b)}</p>
					<p>
						{t.metodo.valorP}:{' '}
						<strong className="tabular-nums">
							{h.p_valor == null
								? t.comun.sinDato
								: h.p_valor < 0.001
									? '< 0,001'.replace(
											',',
											fmt.locale.startsWith('en') ? '.' : ','
										)
									: fmt.numero(h.p_valor, 3)}
						</strong>
						{' · '}
						{t.metodo.efecto}:{' '}
						<strong className="tabular-nums">
							{h.efecto == null ? t.comun.sinDato : fmt.numero(h.efecto, 2)}
						</strong>
						{h.prueba ? ` · ${h.prueba}` : ''}
					</p>
				</>
			) : (
				<p>
					<strong>{t.metodo.noEvaluable}</strong>
					{h.motivo ? ` ${h.motivo}` : ''}
				</p>
			)}
		</li>
	);
}

function Procedencia({ manifiesto: m, ctx }: { manifiesto: Manifiesto; ctx: Contexto }) {
	const { t, fmt } = useIdioma();
	const metodo = useQuery(datos.metodo(ctx));
	const filas: [string, string][] = [
		[t.metodo.procedencia.version, m.version],
		[
			t.metodo.procedencia.generado,
			t.metodo.procedencia.horaDe(
				fmt.fechaHora(m.generado, m.region.zona_horaria),
				m.region.nombre
			)
		],
		[
			t.metodo.procedencia.producto,
			`${m.fuente.mision} ${m.fuente.producto}, ${t.madurez(m.fuente.madurez)}`
		],
		[t.metodo.procedencia.pasadas, fmt.numero(m.fechas.length)],
		...(m.fuente.crids.length
			? ([[t.metodo.procedencia.crids, m.fuente.crids.join(', ')]] as [string, string][])
			: []),
		...(m.codigo ? ([[t.metodo.procedencia.codigo, m.codigo]] as [string, string][]) : []),
		...(metodo.data?.semilla != null
			? ([[t.metodo.procedencia.semilla, String(metodo.data.semilla)]] as [string, string][])
			: []),
		[
			t.metodo.procedencia.grilla,
			t.metodo.procedencia.grillaValor(
				fmt.numero(m.region.grilla.celda_m),
				m.region.grilla.epsg
			)
		]
	];
	return (
		<>
			<dl className="divide-y divide-manglar-olivo/30">
				{filas.map(([nombre, valor]) => (
					<div
						key={nombre}
						className="grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4"
					>
						<dt className="font-medium">{nombre}</dt>
						<dd className="break-words">{valor}</dd>
					</div>
				))}
			</dl>
			<p className="etiqueta text-base">{t.metodo.procedencia.horas}</p>
		</>
	);
}

function Descargas({ ctx }: { ctx: Contexto }) {
	const { t, fmt } = useIdioma();
	const descargas = useQuery(datos.descargas(ctx));
	if (ctx.origen === 'respaldo')
		return <p className="etiqueta text-base">{t.metodo.sinConexion}</p>;
	if (descargas.isPending) return <Cargando />;
	if (descargas.isError) return <p className="etiqueta text-base">{t.metodo.errorSeccion}</p>;
	if (descargas.data.length === 0)
		return <p className="etiqueta text-base">{t.metodo.sinDescargas}</p>;
	return (
		<ul className="divide-y divide-manglar-olivo/30">
			{descargas.data.map(d => (
				<li
					key={`${d.tipo}.${d.formato}`}
					className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
				>
					<div className="min-w-0">
						<p className="font-medium">
							{t.metodo.archivos[d.tipo as keyof typeof t.metodo.archivos] ?? d.tipo}
						</p>
						<p className="etiqueta break-all">
							{d.formato.toUpperCase()} · {fmt.bytes(d.bytes)} · {d.licencia} ·
							SHA-256 {d.sha256.slice(0, 12)}…
						</p>
					</div>
					<a href={d.url} download className="boton boton-contorno min-h-10 px-4">
						<Download className="size-4" aria-hidden />
						{t.metodo.descargar}
					</a>
				</li>
			))}
		</ul>
	);
}
