import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { cn } from '@/shared/utils';

/**
 * Brand pieces: the crayon filter, the wordmark, the isotype and the mangrove
 * strip with its rising notes.
 *
 * Rule of the visual system: the drawing decorates the frame; the map and the
 * data stay clean. Nothing here is ever used to draw a value.
 */

/** SVG filters behind `.crayola` / `.crayola-suave`. Mounted once, at the root. */
export function FiltrosCrayola() {
	return (
		<svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
			<defs>
				<filter id="crayola" x="-5%" y="-10%" width="110%" height="120%">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.9"
						numOctaves="2"
						seed="7"
						result="grano"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="grano"
						scale="3.2"
						xChannelSelector="R"
						yChannelSelector="G"
						result="borde"
					/>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="1.6"
						numOctaves="1"
						seed="3"
						result="poro"
					/>
					<feColorMatrix
						in="poro"
						type="matrix"
						values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.42"
						result="huecos"
					/>
					<feComposite in="borde" in2="huecos" operator="in" />
				</filter>
				<filter id="crayola-suave" x="-5%" y="-10%" width="110%" height="120%">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.8"
						numOctaves="2"
						seed="11"
						result="grano"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="grano"
						scale="1.8"
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</defs>
		</svg>
	);
}

/** The wordmark. Always lowercase; the two "o" of groove in olive. */
export function Logotipo({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				'font-titulo font-bold tracking-tight text-manglar-verde lowercase',
				className
			)}
			aria-label="Mangroove"
		>
			<span aria-hidden>
				mangr<span className="text-manglar-olivo">oo</span>ve
			</span>
		</span>
	);
}

export function Isotipo({ className }: { className?: string }) {
	return (
		<img
			src={`${import.meta.env.BASE_URL}marca/isotipo.webp`}
			alt=""
			width={310}
			height={310}
			draggable={false}
			className={cn('aspect-square select-none', className)}
		/>
	);
}

const GLIFOS = {
	negra: 'M9 2v13.2a3.6 2.8 -20 1 1-1.6-2.4V2z',
	corchea: 'M9 2v13.2a3.6 2.8 -20 1 1-1.6-2.4V2h1.6c.4 2.6 4.4 3.4 4.4 7.2-1-2.2-2.8-3-4.4-3.2z',
	doble: 'M6 4.4l10-2.4v11.6a3.4 2.6 -20 1 1-1.6-2.3V5.8L7.6 7.5v8.3a3.4 2.6 -20 1 1-1.6-2.3z'
} as const;

/** A small hand-drawn music note. Purely decorative. */
export function NotaMusical({
	tipo = 'corchea',
	className,
	style
}: {
	tipo?: keyof typeof GLIFOS;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<svg
			aria-hidden
			viewBox="0 0 18 20"
			className={cn('crayola-suave pointer-events-none size-5 fill-current', className)}
			style={style}
		>
			<path d={GLIFOS[tipo]} />
		</svg>
	);
}

const NOTAS = [
	{ x: 6, tipo: 'negra', duracion: 5.2, retraso: 0.2, deriva: 6, tono: 'text-manglar-olivo' },
	{ x: 22, tipo: 'doble', duracion: 6.4, retraso: 1.7, deriva: -5, tono: 'text-manglar-olivo' },
	{
		x: 44,
		tipo: 'corchea',
		duracion: 4.6,
		retraso: 2.6,
		deriva: 4,
		tono: 'text-manglar-carmesi'
	},
	{ x: 63, tipo: 'doble', duracion: 6.9, retraso: 0.9, deriva: -6, tono: 'text-manglar-olivo' },
	{ x: 80, tipo: 'corchea', duracion: 5.6, retraso: 2.1, deriva: 5, tono: 'text-manglar-olivo' },
	{ x: 92, tipo: 'negra', duracion: 4.9, retraso: 1.2, deriva: -4, tono: 'text-manglar-verde' }
] as const;

const ALTO_FRANJA = 96;

/**
 * Mangrove strip for the foot of a side panel, with notes rising from the
 * trees. Place it as the last child of a `flex flex-col` panel: it takes the
 * free space under the content, so its top edge is the ceiling no note crosses.
 * With less than 24 px of travel the notes are hidden; without room for the
 * strip, nothing is drawn. The notes pause while the panel is off screen.
 */
export function FranjaManglar({ className }: { className?: string }) {
	const marco = useRef<HTMLDivElement>(null);
	const [libre, setLibre] = useState(0);
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const el = marco.current;
		if (!el) return;
		const tamano = new ResizeObserver(([e]) => e && setLibre(e.contentRect.height));
		tamano.observe(el);
		const vista = new IntersectionObserver(([e]) => e && setVisible(e.isIntersecting));
		vista.observe(el);
		return () => {
			tamano.disconnect();
			vista.disconnect();
		};
	}, []);

	const hayFranja = libre >= ALTO_FRANJA + 8;
	const subida = libre - ALTO_FRANJA * 0.7 - 16;

	return (
		<div
			ref={marco}
			aria-hidden
			className={cn('pointer-events-none relative min-h-0 flex-1 overflow-hidden', className)}
		>
			{hayFranja && (
				<>
					{subida >= 24 &&
						NOTAS.map((nota, k) => (
							<NotaMusical
								key={k}
								tipo={nota.tipo}
								className={cn('nota-flotante absolute', nota.tono)}
								style={
									{
										left: `${nota.x}%`,
										bottom: ALTO_FRANJA * 0.7,
										'--subida': `${subida}px`,
										'--duracion': `${nota.duracion}s`,
										'--retraso': `${nota.retraso}s`,
										'--deriva': `${nota.deriva}px`,
										'--giro-inicial': `${-nota.deriva}deg`,
										'--giro-final': `${nota.deriva * 1.3}deg`,
										animationPlayState: visible ? 'running' : 'paused'
									} as CSSProperties
								}
							/>
						))}
					<img
						src={`${import.meta.env.BASE_URL}marca/franja-manglar.webp`}
						alt=""
						draggable={false}
						className="absolute inset-x-0 bottom-0 w-full max-w-none object-cover object-bottom select-none"
						style={{ height: ALTO_FRANJA }}
					/>
				</>
			)}
		</div>
	);
}
