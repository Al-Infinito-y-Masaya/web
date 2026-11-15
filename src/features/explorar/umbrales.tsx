import { FlaskConical } from 'lucide-react';
import { useState } from 'react';

import type { Exploracion, Manifiesto, UmbralesExplorados } from '@/features/datos/esquemas';
import { useIdioma } from '@/features/idioma/idioma';
import { AppException } from '@/shared/models/app-error/app-error';
import { Spinner } from '@/shared/ui/primitives/spinner';

/**
 * "What if the thresholds were different?" The visitor moves a threshold and
 * the API recomputes the disconnection over the same version. The result is
 * always labelled as an exploration: it never replaces the published version.
 */

type Props = {
	manifiesto: Manifiesto;
	resultado: Exploracion | null;
	cargando: boolean;
	error: unknown;
	disponible: boolean;
	onAplicar: (umbrales: UmbralesExplorados) => void;
	onSalir: () => void;
};

function motivo(error: unknown): 'limite' | 'rango' | 'otro' {
	const e = error instanceof AppException ? error.error : undefined;
	const status = e && 'status' in e ? e.status : undefined;
	if (status === 429) return 'limite';
	if (status === 422 || status === 400 || e?.kind === 'validation') return 'rango';
	return 'otro';
}

export function ExplorarUmbrales({
	manifiesto,
	resultado,
	cargando,
	error,
	disponible,
	onAplicar,
	onSalir
}: Props) {
	const { t, fmt } = useIdioma();
	const u = manifiesto.umbrales;
	const base = {
		if_alta_desconectada: u.if_alta_desconectada ?? 0.2,
		min_fechas_alta: u.min_fechas_alta ?? 3,
		marea_alta_m: u.marea_alta_m ?? 0.55
	};
	const [valores, setValores] = useState(base);
	const cambiados: UmbralesExplorados = Object.fromEntries(
		(Object.keys(base) as (keyof typeof base)[])
			.filter(k => valores[k] !== base[k])
			.map(k => [k, valores[k]])
	);
	const hayCambios = Object.keys(cambiados).length > 0;
	const total = resultado?.resumen.find(r => r.pais === '') ?? resultado?.resumen[0];

	const campos = [
		{
			clave: 'if_alta_desconectada' as const,
			nombre: t.umbrales.desconexion,
			min: 0,
			max: 1,
			paso: 0.05,
			texto: (v: number) => t.umbrales.menosDe(fmt.porcentaje(v))
		},
		{
			clave: 'min_fechas_alta' as const,
			nombre: t.umbrales.minimo,
			min: 1,
			max: 20,
			paso: 1,
			texto: (v: number) => fmt.numero(v)
		},
		{
			clave: 'marea_alta_m' as const,
			nombre: t.umbrales.mareaAlta,
			min: -1,
			max: 3,
			paso: 0.05,
			texto: (v: number) => t.umbrales.desde(fmt.metros(v))
		}
	];

	return (
		<details className="tarjeta group p-4" open={resultado !== null || undefined}>
			<summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-base font-semibold">
				<FlaskConical className="size-4 shrink-0" aria-hidden />
				<span className="font-titulo">{t.umbrales.titulo}</span>
			</summary>
			<div className="mt-3 space-y-4">
				<p className="etiqueta">{t.umbrales.intro}</p>
				{!disponible ? (
					<p role="status">{t.umbrales.sinConexion}</p>
				) : (
					<form
						className="space-y-4"
						onSubmit={e => {
							e.preventDefault();
							if (hayCambios) onAplicar(cambiados);
						}}
					>
						{campos.map(campo => (
							<label key={campo.clave} className="block">
								<span className="flex items-baseline justify-between gap-2">
									<span>{campo.nombre}</span>
									<output className="shrink-0 font-semibold whitespace-nowrap tabular-nums">
										{campo.texto(valores[campo.clave])}
									</output>
								</span>
								<input
									type="range"
									min={campo.min}
									max={campo.max}
									step={campo.paso}
									value={valores[campo.clave]}
									onChange={e =>
										setValores(v => ({
											...v,
											[campo.clave]: Number(e.target.value)
										}))
									}
									className="mt-1 h-8 w-full cursor-pointer accent-[var(--manglar-verde)]"
								/>
								<span className="etiqueta block">
									{t.umbrales.publicado(campo.texto(base[campo.clave]))}
								</span>
							</label>
						))}
						<div className="flex flex-wrap gap-2">
							<button
								type="submit"
								className="boton boton-primario min-h-10 px-4"
								disabled={!hayCambios || cargando}
							>
								{cargando && <Spinner className="size-4" />}
								{t.umbrales.aplicar}
							</button>
							{(resultado || hayCambios) && (
								<button
									type="button"
									className="boton boton-contorno min-h-10 px-4"
									onClick={() => {
										setValores(base);
										onSalir();
									}}
								>
									{t.umbrales.volver}
								</button>
							)}
						</div>
					</form>
				)}
				{error != null && !cargando && (
					<p role="alert" className="font-medium">
						{t.umbrales.error[motivo(error)]}
					</p>
				)}
				{resultado && total && (
					<div
						role="status"
						className="rounded-xl border border-warning-border bg-warning p-3 text-warning-foreground"
					>
						<p className="font-semibold">{t.umbrales.esExploracion}</p>
						<p className="leading-snug">
							{t.umbrales.resultado(
								fmt.hectareas(total.ha_desconectada),
								fmt.hectareas(total.ha_manglar),
								fmt.hectareas(total.ha_insuficiente)
							)}
						</p>
					</div>
				)}
			</div>
		</details>
	);
}
