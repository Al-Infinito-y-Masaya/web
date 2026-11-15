import { useCallback, useEffect, useRef, useState } from 'react';

import { appConfig } from '@/config/app';

/**
 * The team's intro song, playing along with the intro animation.
 *
 * Browsers block audio until the page gets a gesture, so on a first visit the
 * song may not start by itself: it then starts on the first click or key, or
 * from the music button, joining the animation where it is. Replaying the
 * intro is a click, so it always sounds. Skipping fades it out; when the intro
 * ends on its own the song plays to its end. Muting is remembered.
 */

const URL_CANCION = `${import.meta.env.BASE_URL}sounds/${encodeURIComponent('Intro song')}.m4a`;
const VOLUMEN = 0.8;
const FUNDIDO_MS = 450;

function silenciada() {
	try {
		return localStorage.getItem(appConfig.storageKeys.introMusica) === '0';
	} catch {
		return false;
	}
}

function recordar(activa: boolean) {
	try {
		localStorage.setItem(appConfig.storageKeys.introMusica, activa ? '1' : '0');
	} catch {
		/* Storage blocked: the choice lasts until the page is closed. */
	}
}

/**
 * `enCurso`: the intro is running. `saltada`: it was cut short, so the song
 * fades out instead of finishing. `vuelta` restarts the song on each replay.
 */
export function useMusicaIntro({
	enCurso,
	saltada,
	vuelta
}: {
	enCurso: boolean;
	saltada: boolean;
	vuelta: number;
}) {
	const audio = useRef<HTMLAudioElement | null>(null);
	const inicio = useRef(0);
	const enCursoRef = useRef(enCurso);
	const [activa, setActiva] = useState(() => !silenciada());
	const [sonando, setSonando] = useState(false);

	useEffect(() => {
		enCursoRef.current = enCurso;
	}, [enCurso]);

	const cancion = useCallback(() => {
		if (!audio.current) {
			const el = new Audio(URL_CANCION);
			el.preload = 'auto';
			el.addEventListener('playing', () => setSonando(true));
			el.addEventListener('pause', () => setSonando(false));
			el.addEventListener('ended', () => setSonando(false));
			audio.current = el;
		}
		return audio.current;
	}, []);

	/** Plays from where the animation is now. Rejects while the browser blocks audio. */
	const tocar = useCallback(() => {
		const el = cancion();
		el.volume = VOLUMEN;
		el.currentTime = Math.max(0, (performance.now() - inicio.current) / 1000);
		return el.play();
	}, [cancion]);

	const fundir = useCallback(() => {
		const el = audio.current;
		if (!el || el.paused) return;
		const desde = el.volume;
		const t0 = performance.now();
		const paso = (ahora: number) => {
			const f = Math.min(1, (ahora - t0) / FUNDIDO_MS);
			el.volume = desde * (1 - f);
			if (f < 1) requestAnimationFrame(paso);
			else el.pause();
		};
		requestAnimationFrame(paso);
	}, []);

	// Each run of the intro starts the song from the top.
	useEffect(() => {
		if (!enCurso) return;
		inicio.current = performance.now();
		if (!activa) return;

		let esperando = false;
		const alGesto = () => {
			quitar();
			// After the gesture's own handlers: a click on "skip" must not start the song.
			window.setTimeout(() => enCursoRef.current && void tocar().catch(() => {}), 0);
		};
		const quitar = () => {
			if (!esperando) return;
			esperando = false;
			window.removeEventListener('pointerdown', alGesto, true);
			window.removeEventListener('keydown', alGesto, true);
		};

		tocar().catch(() => {
			esperando = true;
			window.addEventListener('pointerdown', alGesto, true);
			window.addEventListener('keydown', alGesto, true);
		});
		return quitar;
		// `activa` is read at the start of a run; the button handles changes during it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enCurso, vuelta, tocar]);

	useEffect(() => {
		if (saltada) fundir();
	}, [saltada, fundir]);

	// Leaving the home screen silences it.
	useEffect(
		() => () => {
			audio.current?.pause();
			audio.current = null;
		},
		[]
	);

	const alternar = useCallback(() => {
		if (sonando) {
			recordar(false);
			setActiva(false);
			fundir();
			return;
		}
		recordar(true);
		setActiva(true);
		if (enCursoRef.current) void tocar().catch(() => {});
	}, [sonando, fundir, tocar]);

	return { sonando, alternar };
}
