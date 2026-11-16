import { percent, type Cell, type Dataset } from './data';
import type { Layer } from './layers';
import { useLab } from './textos';

export function Legend({ layer, dataset }: { layer: Layer; dataset: Dataset }) {
	const { t } = useLab();
	const classes = Object.entries(t.leyenda.clases);
	if (layer === 'clases')
		return (
			<ul className="exp-legend" aria-label={t.leyenda.aria}>
				{classes.map(([k, label]) => (
					<li key={k}>
						<i
							style={{
								background: dataset.manifest.capas.colores_clases?.[k!] ?? '#999'
							}}
						/>
						{label}
					</li>
				))}
			</ul>
		);
	if (layer === 'rgb') return <p className="exp-caption">{t.leyenda.rgb}</p>;
	if (layer === 'estado')
		return (
			<ul className="exp-legend">
				<li>
					<i style={{ background: '#2f5f50' }} />
					{t.leyenda.conexion}
				</li>
				<li>
					<i style={{ background: '#bc9435' }} />
					{t.leyenda.baja}
				</li>
				<li>
					<i style={{ background: '#3987e5' }} />
					{t.leyenda.persistente}
				</li>
				<li>
					<i style={{ background: '#9a9893' }} />
					{t.leyenda.insuficiente}
				</li>
			</ul>
		);
	return (
		<p className="exp-caption">
			{layer === 'sens_db_m' ? t.leyenda.sensibilidad : t.leyenda.frecuencia}
		</p>
	);
}
export function Inspector({
	cell: c,
	dataset,
	selectedDate
}: {
	cell: Cell;
	dataset: Dataset;
	selectedDate: string;
}) {
	const { t, numero } = useLab();
	const number = (n: number | null, digits = 2) => numero(n, digits);
	const metric = c.metricas;
	const now = c.serie.find(p => p.fecha_id === selectedDate);
	return (
		<>
			<p className="exp-coordinate">
				{number(c.centroide[1], 5)}° {t.inspector.norte} ·{' '}
				{number(Math.abs(c.centroide[0]), 5)}° {t.inspector.oeste}
			</p>
			<p className="exp-cell-state">
				{!c.en_mascara
					? t.inspector.fueraMascara
					: metric
						? t.estados[metric.estado]
						: t.inspector.sinMetricas}
			</p>
			{metric && (
				<>
					<dl className="exp-metrics">
						<div>
							<dt>{t.inspector.inundacionTodas}</dt>
							<dd>{percent(metric.if, t)}</dd>
						</div>
						<div>
							<dt>{t.inspector.enAlta}</dt>
							<dd>{percent(metric.if_alta, t)}</dd>
						</div>
						<div>
							<dt>{t.inspector.enBaja}</dt>
							<dd>{percent(metric.if_baja, t)}</dd>
						</div>
						<div>
							<dt>{t.inspector.respuestaHh}</dt>
							<dd>{number(metric.sens_db_m)} dB/m</dd>
						</div>
						<div>
							<dt>{t.inspector.pRespuesta}</dt>
							<dd>
								{metric.sens_p === 0
									? `< ${(0.001).toLocaleString(t.locale)}`
									: number(metric.sens_p, 3)}
							</dd>
						</div>
						<div>
							<dt>{t.inspector.fechasAltaBaja}</dt>
							<dd>
								{metric.n_fechas_alta} / {metric.n_fechas_baja}
							</dd>
						</div>
					</dl>
					<p className="exp-caption">{t.inspector.nota(percent(metric.p_error, t))}</p>
				</>
			)}
			<p>
				<strong>{t.inspector.fechaSeleccionada}</strong> {now?.clase ?? t.sinDato} · HH{' '}
				{number(now?.hh_db ?? null)} dB
			</p>
			<Series cell={c} dataset={dataset} />
			<details>
				<summary>{t.inspector.verObservaciones(c.serie.length)}</summary>
				<div className="exp-series-table">
					<table>
						<thead>
							<tr>
								<th>{t.inspector.fecha}</th>
								<th>HH dB</th>
								<th>HV dB</th>
								<th>{t.inspector.clase}</th>
							</tr>
						</thead>
						<tbody>
							{c.serie.map(p => (
								<tr key={p.fecha_id}>
									<th scope="row">
										{p.fecha_id.replace('_asc', ' ↑').replace('_desc', ' ↓')}
									</th>
									<td>{number(p.hh_db)}</td>
									<td>{number(p.hv_db)}</td>
									<td>{p.clase ?? t.sinDato}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
			{c.cambio && (
				<p className="exp-change">
					{t.inspector.cambio(
						c.cambio.fecha_id.slice(0, 10),
						number(c.cambio.delta_hv_db)
					)}
				</p>
			)}
		</>
	);
}
function Series({ cell, dataset }: { cell: Cell; dataset: Dataset }) {
	const { t, numero } = useLab();
	const number = (n: number | null, digits = 2) => numero(n, digits);
	const values = cell.serie.map(p => p.hh_db).filter((v): v is number => v !== null);
	if (!values.length) return <p>{t.inspector.sinSenal}</p>;
	const low = Math.floor(Math.min(...values)) - 0.5,
		high = Math.ceil(Math.max(...values)) + 0.5;
	const x = (i: number) => 36 + (i * 264) / Math.max(1, cell.serie.length - 1),
		y = (v: number) => 120 - ((v - low) * 96) / (high - low);
	// Individual segments preserve gaps: null observations never become zero or a bridge.
	return (
		<figure className="exp-series">
			<figcaption>{t.inspector.serie}</figcaption>
			<svg viewBox="0 0 320 154" role="img" aria-label={t.inspector.serieAria}>
				{[low, (low + high) / 2, high].map(v => (
					<g key={v}>
						<line x1="36" x2="300" y1={y(v)} y2={y(v)} stroke="#cad0c0" />
						<text x="30" y={y(v) + 4} textAnchor="end">
							{number(v, 1)}
						</text>
					</g>
				))}
				{cell.serie.map((p, i) => {
					const prev = cell.serie[i - 1];
					return p.hh_db !== null ? (
						<g key={p.fecha_id}>
							{prev?.hh_db !== undefined && prev.hh_db !== null && (
								<line
									x1={x(i - 1)}
									y1={y(prev.hh_db)}
									x2={x(i)}
									y2={y(p.hh_db)}
									stroke="#0f7f9e"
									strokeWidth="2"
								/>
							)}
							<circle cx={x(i)} cy={y(p.hh_db)} r="3" fill="#0f7f9e">
								<title>
									{p.fecha_id}: {p.hh_db} dB; {t.inspector.marea}{' '}
									{dataset.manifest.fechas[i]?.marea_m} m
								</title>
							</circle>
						</g>
					) : null;
				})}
				<text x="36" y="146">
					{cell.serie[0]?.fecha_id.slice(5, 10)}
				</text>
				<text x="300" y="146" textAnchor="end">
					{cell.serie.at(-1)?.fecha_id.slice(5, 10)}
				</text>
			</svg>
		</figure>
	);
}
