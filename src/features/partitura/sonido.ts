import { useSyncExternalStore } from 'react';

/**
 * The score, played. Each pass sounds as one note whose pitch comes from the
 * estimated tide (`marea_m`): low tide low, high tide high, on a pentatonic
 * scale so any sequence of passes sounds consonant. Nothing else is encoded in
 * the sound, and a pass without a tide estimate is silent.
 *
 * The notes are the team's own recordings (`public/sounds`). Browsers only
 * allow audio after a user gesture, so sound starts off and the button of the
 * score turns it on.
 */

const ESCALA = ['C', 'D', 'E', 'G', 'A'] as const;
/** Two octaves of the scale: ten steps from the lowest to the highest tide. */
export const PASOS = ESCALA.length * 2;

/** Scale step (0 = lowest) for a tide height within the range of the score. */
export function pasoDeMarea(marea: number, [min, max]: readonly [number, number]) {
	if (max <= min) return 0;
	const fraccion = Math.min(1, Math.max(0, (marea - min) / (max - min)));
	return Math.min(PASOS - 1, Math.floor(fraccion * PASOS));
}

type Estado = { activo: boolean; cargando: boolean };

let estado: Estado = { activo: false, cargando: false };
const oyentes = new Set<() => void>();
const publicar = (nuevo: Estado) => {
	estado = nuevo;
	oyentes.forEach(oyente => oyente());
};

let contexto: AudioContext | null = null;
const muestras = new Map<string, AudioBuffer>();

async function cargar(ctx: AudioContext, nombre: string) {
	if (muestras.has(nombre)) return;
	const respuesta = await fetch(`/sounds/${encodeURIComponent(nombre)}.m4a`);
	if (!respuesta.ok) throw new Error(`No se pudo cargar la nota ${nombre}.`);
	muestras.set(nombre, await ctx.decodeAudioData(await respuesta.arrayBuffer()));
}

function sonar(nombre: string, { ritmo = 1, volumen = 0.8, apagada = false } = {}) {
	const buffer = muestras.get(nombre);
	if (!contexto || !buffer) return;
	const fuente = contexto.createBufferSource();
	fuente.buffer = buffer;
	fuente.playbackRate.value = ritmo;
	const ganancia = contexto.createGain();
	const ahora = contexto.currentTime;
	ganancia.gain.setValueAtTime(apagada ? volumen * 0.35 : volumen, ahora);
	// Let the note ring, then fade so consecutive passes do not pile up.
	ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + (apagada ? 0.5 : 1.6));
	let salida: AudioNode = fuente;
	if (apagada) {
		const filtro = contexto.createBiquadFilter();
		filtro.type = 'lowpass';
		filtro.frequency.value = 700;
		fuente.connect(filtro);
		salida = filtro;
	}
	salida.connect(ganancia).connect(contexto.destination);
	fuente.start();
	fuente.stop(ahora + 2);
}

export const sonido = {
	/** Turns sound on (must be called from a click) or off. Resolves with the new state. */
	async alternar(): Promise<boolean> {
		if (estado.activo) {
			publicar({ activo: false, cargando: false });
			return false;
		}
		publicar({ activo: false, cargando: true });
		try {
			contexto ??= new AudioContext();
			await contexto.resume();
			await Promise.all([...ESCALA, 'Riff'].map(nota => cargar(contexto!, nota)));
			publicar({ activo: true, cargando: false });
			// A short riff confirms the sound is on.
			sonar('Riff', { volumen: 0.5 });
			return true;
		} catch {
			publicar({ activo: false, cargando: false });
			return false;
		}
	},

	/**
	 * Plays the note of a pass. `marea` null (no estimate) is a silence.
	 * `apagada` marks a pass excluded by heavy rain: same pitch, muffled.
	 */
	tocarMarea(marea: number | null, rango: readonly [number, number], apagada = false) {
		if (!estado.activo || marea === null) return;
		const paso = pasoDeMarea(marea, rango);
		const nota = ESCALA[paso % ESCALA.length]!;
		sonar(nota, { ritmo: paso >= ESCALA.length ? 2 : 1, apagada });
	}
};

export function useSonido() {
	return useSyncExternalStore(
		oyente => {
			oyentes.add(oyente);
			return () => oyentes.delete(oyente);
		},
		() => estado,
		() => estado
	);
}
