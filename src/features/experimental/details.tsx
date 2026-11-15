import { percent, stateLabels, type Cell, type Dataset } from './data';
import type { Layer } from './map';

const number = (n: number | null, digits = 2) =>
	n === null ? 'Sin dato' : n.toLocaleString('es-NI', { maximumFractionDigits: digits });
export function Legend({ layer, dataset }: { layer: Layer; dataset: Dataset }) {
	const classes = [
		['IV', 'Vegetación inundada'],
		['OW', 'Agua abierta'],
		['NI', 'No inundado'],
		['NC', 'No clasificado']
	];
	if (layer === 'clases')
		return (
			<ul className="exp-legend" aria-label="Leyenda">
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
	if (layer === 'rgb')
		return (
			<p className="exp-caption">
				Rojo: HH · verde: HV · azul: HH − HV. El color representa intensidad del radar, no
				una fotografía.
			</p>
		);
	if (layer === 'estado')
		return (
			<ul className="exp-legend">
				<li>
					<i style={{ background: '#2f5f50' }} />
					Conexión compatible
				</li>
				<li>
					<i style={{ background: '#bc9435' }} />
					Baja frecuencia
				</li>
				<li>
					<i style={{ background: '#3987e5' }} />
					Persistente
				</li>
				<li>
					<i style={{ background: '#9a9893' }} />
					Insuficiente
				</li>
			</ul>
		);
	return (
		<p className="exp-caption">
			{layer === 'sens_db_m'
				? 'Respuesta HH en dB/m: marrón ≤ −0,5 · papel 0 · verde ≥ 0,5. Gris: sin estimación. La intensidad del color no indica significancia estadística.'
				: 'Frecuencia de inundación: papel 0 % · azul 100 %. Gris: sin estimación. Solo se muestran celdas de manglar.'}
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
	const metric = c.metricas;
	const now = c.serie.find(p => p.fecha_id === selectedDate);
	return (
		<>
			<p className="exp-coordinate">
				{number(c.centroide[1], 5)}° N · {number(Math.abs(c.centroide[0]), 5)}° O
			</p>
			<p className="exp-cell-state">
				{!c.en_mascara
					? 'Fuera de la máscara de manglar'
					: metric
						? stateLabels[metric.estado]
						: 'Sin métricas disponibles'}
			</p>
			{metric && (
				<>
					<dl className="exp-metrics">
						<div>
							<dt>Inundación · todas</dt>
							<dd>{percent(metric.if)}</dd>
						</div>
						<div>
							<dt>En marea alta</dt>
							<dd>{percent(metric.if_alta)}</dd>
						</div>
						<div>
							<dt>En marea baja</dt>
							<dd>{percent(metric.if_baja)}</dd>
						</div>
						<div>
							<dt>Respuesta HH</dt>
							<dd>{number(metric.sens_db_m)} dB/m</dd>
						</div>
						<div>
							<dt>p de respuesta HH</dt>
							<dd>{metric.sens_p === 0 ? '< 0,001' : number(metric.sens_p, 3)}</dd>
						</div>
						<div>
							<dt>Fechas alta / baja</dt>
							<dd>
								{metric.n_fechas_alta} / {metric.n_fechas_baja}
							</dd>
						</div>
					</dl>
					<p className="exp-caption">
						{percent(metric.p_error)} de fechas cerca de un umbral. No es exactitud
						validada. Los valores p por celda están redondeados.
					</p>
				</>
			)}
			<p>
				<strong>Fecha seleccionada:</strong> {now?.clase ?? 'Sin dato'} · HH{' '}
				{number(now?.hh_db ?? null)} dB
			</p>
			<Series cell={c} dataset={dataset} />
			<details>
				<summary>Ver las {c.serie.length} observaciones</summary>
				<div className="exp-series-table">
					<table>
						<thead>
							<tr>
								<th>Fecha / pista</th>
								<th>HH dB</th>
								<th>HV dB</th>
								<th>Clase</th>
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
									<td>{p.clase ?? 'Sin dato'}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</details>
			{c.cambio && (
				<p className="exp-change">
					Cambio de copa candidato: {c.cambio.fecha_id.slice(0, 10)}, ΔHV{' '}
					{number(c.cambio.delta_hv_db)} dB. Requiere verificación independiente.
				</p>
			)}
		</>
	);
}
function Series({ cell, dataset }: { cell: Cell; dataset: Dataset }) {
	const values = cell.serie.map(p => p.hh_db).filter((v): v is number => v !== null);
	if (!values.length) return <p>No hay señal HH válida para graficar.</p>;
	const low = Math.floor(Math.min(...values)) - 0.5,
		high = Math.ceil(Math.max(...values)) + 0.5;
	const x = (i: number) => 36 + (i * 264) / Math.max(1, cell.serie.length - 1),
		y = (v: number) => 120 - ((v - low) * 96) / (high - low);
	// Individual segments preserve gaps: null observations never become zero or a bridge.
	return (
		<figure className="exp-series">
			<figcaption>Señal HH de la celda · dB</figcaption>
			<svg
				viewBox="0 0 320 154"
				role="img"
				aria-label="Evolución de HH en las veinte adquisiciones. Los valores exactos están en la tabla."
			>
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
									{p.fecha_id}: {p.hh_db} dB; marea{' '}
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
