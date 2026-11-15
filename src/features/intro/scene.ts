import {
	createRng,
	SHRIMP_ASPECT,
	SURFACE_Y,
	WORLD_HEIGHT,
	WORLD_WIDTH,
	type IntroArt
} from './art';
import { introPalette } from './palette';

/**
 * Progreso de cada movimiento de cámara (0 → 1). La línea de tiempo de GSAP
 * anima estos valores; la escena los lee en cada cuadro.
 */
export interface CameraProgress {
	/** Primer plano del camarón (leve acercamiento). */
	closeUp: number;
	/** Zoom hacia afuera para ver el cardumen. */
	school: number;
	/** Subida fuera del agua hasta el manglar. */
	rise: number;
}

export interface IntroScene {
	progress: CameraProgress;
	/** Reinicia el nado del camarón principal (al repetir la intro). */
	restart(): void;
	destroy(): void;
}

interface Swimmer {
	x: number;
	y: number;
	width: number;
	/** 1 = nada a la derecha, -1 = a la izquierda. */
	dir: 1 | -1;
	speed: number;
	phase: number;
}

interface Bubble {
	x: number;
	y: number;
	radius: number;
	speed: number;
	phase: number;
}

const HERO_WIDTH = 900;
/** Orden de las poses del camarón: ida y vuelta para que el aleteo sea continuo. */
const POSE_SEQUENCE = [0, 1, 2, 1];
const BOIL_FPS = 9;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Interpola la escala en escala logarítmica para que el zoom se sienta parejo. */
const lerpScale = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));

const heroX = (t: number) => 1820 - 70 * t;
const heroY = (t: number) => 3000 + Math.sin(t * 1.6) * 12;

export function createIntroScene(
	canvas: HTMLCanvasElement,
	art: IntroArt,
	{ reducedMotion }: { reducedMotion: boolean }
): IntroScene {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('El navegador no soporta canvas 2D');

	const progress: CameraProgress = { closeUp: 0, school: 0, rise: 0 };
	let width = 0;
	let height = 0;
	let dpr = 1;
	let heroTime = 0;
	let clock = 0;
	let last = performance.now();
	let frame = 0;

	const rng = createRng(77);
	const school: Swimmer[] = Array.from({ length: 18 }, () => ({
		x: rng() * WORLD_WIDTH,
		y: 2080 + rng() * 1260,
		width: 240 + rng() * 240,
		dir: rng() < 0.3 ? 1 : -1,
		speed: 50 + rng() * 80,
		phase: rng() * Math.PI * 2
	}));
	school.sort((a, b) => a.width - b.width);
	const far = school.filter(s => s.width < 340);
	const near = school.filter(s => s.width >= 340);
	const bubbles: Bubble[] = Array.from({ length: 46 }, () => ({
		x: rng() * WORLD_WIDTH,
		y: 1800 + rng() * 1750,
		radius: 5 + rng() * 13,
		speed: 40 + rng() * 70,
		phase: rng() * Math.PI * 2
	}));

	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
	}

	function camera() {
		const heroScale = Math.min(1.35, (width * 0.62) / HERO_WIDTH, (height * 0.62) / 390);
		const schoolScale = Math.max(width / WORLD_WIDTH, height / 1850);
		const finalScale = Math.max(width / WORLD_WIDTH, height / 1800);

		let x = heroX(heroTime) - 40;
		let y = heroY(heroTime);
		let s = heroScale * (0.92 + 0.08 * progress.closeUp);
		x = lerp(x, 1600, progress.school);
		y = lerp(y, 2760, progress.school);
		s = lerpScale(s, schoolScale, progress.school);
		x = lerp(x, 1600, progress.rise);
		y = lerp(y, 1330, progress.rise);
		s = lerpScale(s, finalScale, progress.rise);

		// Nunca mostrar fuera del mundo dibujado.
		const halfW = width / (2 * s);
		const halfH = height / (2 * s);
		x =
			halfW * 2 >= WORLD_WIDTH
				? WORLD_WIDTH / 2
				: Math.min(Math.max(x, halfW), WORLD_WIDTH - halfW);
		y =
			halfH * 2 >= WORLD_HEIGHT
				? WORLD_HEIGHT / 2
				: Math.min(Math.max(y, halfH), WORLD_HEIGHT - halfH);
		return { x, y, s };
	}

	function drawShrimp(
		frames: HTMLCanvasElement[],
		x: number,
		y: number,
		w: number,
		dir: 1 | -1,
		rotation: number,
		poseIndex: number
	) {
		const h = w * SHRIMP_ASPECT;
		const pose = POSE_SEQUENCE[((poseIndex % 4) + 4) % 4];
		ctx!.save();
		ctx!.translate(x, y);
		ctx!.rotate(rotation);
		if (dir > 0) ctx!.scale(-1, 1);
		ctx!.drawImage(frames[pose], -w / 2, -h / 2, w, h);
		ctx!.restore();
	}

	function drawSwimmer(s: Swimmer, boil: number) {
		drawShrimp(
			art.shrimp,
			s.x,
			s.y + Math.sin(clock * 1.3 + s.phase) * 12,
			s.width,
			s.dir,
			Math.sin(clock * 2 + s.phase) * 0.05,
			boil + Math.floor(s.phase * 3)
		);
	}

	function tick(now: number) {
		// El primer cuadro puede llegar con una marca de tiempo anterior: nunca avanzar hacia atrás.
		const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
		last = Math.max(last, now);
		if (!reducedMotion) {
			heroTime += dt;
			clock += dt;
			for (const s of school) {
				s.x += s.dir * s.speed * dt;
				if (s.x < -400) s.x = WORLD_WIDTH + 400;
				if (s.x > WORLD_WIDTH + 400) s.x = -400;
			}
			for (const b of bubbles) {
				b.y -= b.speed * dt;
				if (b.y < SURFACE_Y + 15) {
					b.y = 3550;
					b.x = Math.random() * WORLD_WIDTH;
				}
			}
		}

		const cam = camera();
		ctx!.setTransform(1, 0, 0, 1, 0, 0);
		ctx!.fillStyle = introPalette.oceano;
		ctx!.fillRect(0, 0, canvas.width, canvas.height);
		ctx!.setTransform(
			dpr * cam.s,
			0,
			0,
			dpr * cam.s,
			dpr * (width / 2 - cam.x * cam.s),
			dpr * (height / 2 - cam.y * cam.s)
		);
		ctx!.imageSmoothingQuality = 'high';
		ctx!.drawImage(art.sky, 0, 0, WORLD_WIDTH, 1800);
		ctx!.drawImage(art.water, 0, 1700, WORLD_WIDTH, 1900);

		const boil = Math.floor(clock * BOIL_FPS);
		ctx!.globalAlpha = 0.82;
		for (const s of far) drawSwimmer(s, boil);
		ctx!.globalAlpha = 1;
		ctx!.drawImage(art.mangrove[boil % 2], 0, 700, WORLD_WIDTH, 1400);
		for (const s of near) drawSwimmer(s, boil);
		drawShrimp(
			art.hero,
			heroX(heroTime),
			heroY(heroTime),
			HERO_WIDTH,
			-1,
			Math.sin(clock * 1.8) * 0.035,
			boil
		);

		ctx!.strokeStyle = 'rgba(234, 211, 157, 0.6)';
		ctx!.lineWidth = 3;
		for (const b of bubbles) {
			const x = b.x + Math.sin(clock * 2 + b.phase) * 8;
			ctx!.beginPath();
			ctx!.ellipse(x, b.y, b.radius, b.radius * 0.9, 0, 0, Math.PI * 2);
			ctx!.stroke();
			ctx!.beginPath();
			ctx!.arc(x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.22, 0, Math.PI * 2);
			ctx!.stroke();
		}

		frame = requestAnimationFrame(tick);
	}

	resize();
	window.addEventListener('resize', resize);
	frame = requestAnimationFrame(tick);

	return {
		progress,
		restart() {
			heroTime = 0;
		},
		destroy() {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', resize);
		}
	};
}
