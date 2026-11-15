import { ArrowUpRight, MapIcon, ServerIcon, type LucideIcon } from 'lucide-react';
import { siGithub } from 'simple-icons';

import { appConfig } from '@/config/app';
import { useIdioma } from '@/features/idioma/idioma';
import { cn } from '@/shared/utils';

import { NotaMusical } from './marca';

/**
 * Where the code lives: the team's GitHub organization and its two repos.
 * The repos hang from the organization like roots from a mangrove trunk.
 */

const REPOS = [
	{ clave: 'web', url: appConfig.repositories.web, Icono: MapIcon },
	{ clave: 'api', url: appConfig.repositories.api, Icono: ServerIcon }
] as const satisfies readonly { clave: string; url: string; Icono: LucideIcon }[];

/** GitHub mark from Simple Icons. Lucide no longer ships brand icons. */
export function MarcaGithub({ className }: { className?: string }) {
	return (
		<svg aria-hidden viewBox="0 0 24 24" className={cn('size-5 fill-current', className)}>
			<path d={siGithub.path} />
		</svg>
	);
}

/** Full card: the organization on top and the repos branching under it. */
export function CodigoAbierto({ className }: { className?: string }) {
	const { t } = useIdioma();
	const nombreOrg = appConfig.repository.replace(/^https:\/\/|\/$/g, '');

	return (
		<section aria-label={t.codigo.titulo} className={cn('tarjeta relative p-5', className)}>
			<NotaMusical
				tipo="doble"
				className="absolute top-4 right-5 size-6 text-manglar-carmesi"
			/>
			<a
				href={appConfig.repository}
				target="_blank"
				rel="noreferrer"
				className="group flex items-center gap-3 rounded-xl"
			>
				<span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-manglar-verde text-manglar-papel shadow-md">
					<MarcaGithub className="crayola-suave size-7" />
				</span>
				<span className="min-w-0">
					<span className="block font-titulo text-xl font-bold group-hover:underline group-hover:underline-offset-4">
						{appConfig.team}
					</span>
					<span className="etiqueta block truncate">{nombreOrg}</span>
				</span>
				<span className="sr-only">{t.codigo.abreEnGithub}</span>
			</a>

			<ul className="mt-2 ml-6">
				{REPOS.map(({ clave, url, Icono }, k) => (
					<li key={clave} className="relative pl-9">
						<Raiz ultima={k === REPOS.length - 1} />
						<a
							href={url}
							target="_blank"
							rel="noreferrer"
							className="group my-1 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-manglar-arena/60"
						>
							<span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-manglar-verde bg-[#fbf7ec] text-manglar-verde">
								<Icono className="size-5" aria-hidden />
							</span>
							<span className="min-w-0 flex-1">
								<span className="flex items-center gap-1 font-titulo text-lg font-bold lowercase">
									{clave}
									<ArrowUpRight
										className="size-4 text-manglar-olivo transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
										aria-hidden
									/>
								</span>
								<span className="block text-sm leading-snug text-manglar-oceano">
									{t.codigo[clave]}
								</span>
							</span>
							<span className="sr-only">{t.codigo.abreEnGithub}</span>
						</a>
					</li>
				))}
			</ul>
		</section>
	);
}

/** Hand-drawn root from the trunk to one repo; the last one ends in its curve. */
function Raiz({ ultima }: { ultima: boolean }) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 36 100"
			preserveAspectRatio="none"
			className="crayola-suave absolute top-0 left-0 h-full w-9 overflow-visible fill-none stroke-manglar-olivo"
			strokeWidth={2.5}
			strokeLinecap="round"
		>
			<path
				d={ultima ? 'M3 0 V38 Q3 50 18 50 H32' : 'M3 0 V100 M3 38 Q3 50 18 50 H32'}
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}

/** Compact version for the foot of the home screen, over the illustration. */
export function CodigoAbiertoPie({ className }: { className?: string }) {
	const { t } = useIdioma();

	return (
		<nav aria-label={t.codigo.titulo} className={cn('flex items-center gap-1.5', className)}>
			<a
				href={appConfig.repository}
				target="_blank"
				rel="noreferrer"
				className="inline-flex size-10 items-center justify-center rounded-full bg-manglar-verde/80 text-manglar-papel shadow-md backdrop-blur-sm transition-colors hover:bg-manglar-verde"
			>
				<MarcaGithub className="size-5" />
				<span className="sr-only">
					{appConfig.team}, {t.codigo.abreEnGithub}
				</span>
			</a>
			{REPOS.map(({ clave, url, Icono }) => (
				<a
					key={clave}
					href={url}
					target="_blank"
					rel="noreferrer"
					className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-manglar-verde/80 px-3.5 pt-0.5 font-titulo text-sm font-semibold text-manglar-papel lowercase shadow-md backdrop-blur-sm transition-colors hover:bg-manglar-verde"
				>
					<Icono className="size-4" aria-hidden />
					{clave}
					<span className="sr-only">, {t.codigo.abreEnGithub}</span>
				</a>
			))}
		</nav>
	);
}
