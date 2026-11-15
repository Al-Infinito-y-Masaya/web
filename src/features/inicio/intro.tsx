import { useCallback, useEffect, useState, type CSSProperties } from 'react';

import { appConfig } from '@/config/app';

/**
 * Animated intro of the home screen: the camera starts under the water of the
 * estuary, follows a shrimp and its shoal, and rises to the mangrove, where the
 * title is written letter by letter.
 *
 * It plays once per tab, can be skipped at any moment and replayed afterwards,
 * and never plays for visitors who prefer reduced motion. The whole timeline is
 * CSS (transform and opacity only); this hook just knows when it is running.
 */

/** When each part of the home screen enters, in ms from the start. */
export const TIEMPOS = {
	papel: 4300,
	evento: 4500,
	titulo: 4700,
	letra: 80,
	frase: 5600,
	isotipo: 6000,
	botones: 6400,
	pie: 6800
} as const;

const DURACION = TIEMPOS.pie + 600;

const reducido = () =>
	typeof window !== 'undefined' &&
	window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

function vista() {
	try {
		return sessionStorage.getItem(appConfig.storageKeys.intro) === '1';
	} catch {
		return false;
	}
}

function marcarVista() {
	try {
		sessionStorage.setItem(appConfig.storageKeys.intro, '1');
	} catch {
		/* Storage blocked: the intro simply plays again on the next visit. */
	}
}

export function useIntro() {
	const [estado, setEstado] = useState(() => {
		const reproducir = !reducido() && !vista();
		return { enCurso: reproducir, animar: reproducir, vuelta: 0 };
	});

	useEffect(() => {
		if (!estado.enCurso) return;
		const id = window.setTimeout(() => {
			marcarVista();
			// `animar` stays on: the entrances already finished, so nothing jumps.
			setEstado(e => ({ ...e, enCurso: false }));
		}, DURACION);
		return () => window.clearTimeout(id);
	}, [estado.enCurso, estado.vuelta]);

	const saltar = useCallback(() => {
		marcarVista();
		setEstado(e => ({ ...e, enCurso: false, animar: false }));
	}, []);

	const repetir = useCallback(() => {
		setEstado(e => ({ enCurso: true, animar: true, vuelta: e.vuelta + 1 }));
	}, []);

	return {
		...estado,
		saltar,
		repetir,
		/** Replaying is offered only where motion is welcome. */
		puedeRepetir: !reducido(),
		/** Entrance props for an element of the home screen: `{...entra(ms)}`. */
		entra: (ms: number) =>
			estado.animar
				? { 'data-entra': '', style: { animationDelay: `${ms}ms` } as CSSProperties }
				: {}
	};
}

const CARDUMEN = [
	{ y: 14, ancho: 96, duracion: 3400, retraso: 900 },
	{ y: 24, ancho: 72, duracion: 3100, retraso: 1250 },
	{ y: 58, ancho: 110, duracion: 3600, retraso: 1050 },
	{ y: 68, ancho: 80, duracion: 3200, retraso: 1500 },
	{ y: 78, ancho: 64, duracion: 3000, retraso: 1750 },
	{ y: 8, ancho: 60, duracion: 3300, retraso: 1900 }
];

function Camaron({
	y,
	ancho,
	duracion,
	retraso,
	tenue
}: {
	y: number;
	ancho: number | string;
	duracion: number;
	retraso: number;
	tenue?: boolean;
}) {
	return (
		<span
			className="intro-nado absolute left-full block"
			style={
				{
					top: `${y}%`,
					width: ancho,
					opacity: tenue ? 0.8 : 1,
					'--duracion': `${duracion}ms`,
					'--retraso': `${retraso}ms`
				} as CSSProperties
			}
		>
			<span className="intro-vaiven block">
				<span className="camaron block" />
			</span>
		</span>
	);
}

/** The underwater half of the scene. Shrimps appear only here, never in the app. */
export function AguaProfunda() {
	return (
		<div className="absolute inset-x-0 top-1/2 h-1/2 overflow-hidden">
			<img
				src="/marca/agua-profunda.webp"
				alt=""
				draggable={false}
				className="size-full object-cover select-none"
			/>
			<Camaron y={36} ancho="clamp(170px, 24vw, 340px)" duracion={5200} retraso={0} />
			{CARDUMEN.map((camaron, k) => (
				<Camaron key={k} {...camaron} tenue />
			))}
		</div>
	);
}
