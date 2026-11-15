import { introPalette as C } from './palette';

/*
 * Ilustraciones de la intro, estilo crayola + acuarela.
 *
 * Cada capa se escribe como un SVG con filtros (feTurbulence/feDisplacementMap)
 * y se rasteriza una sola vez a un canvas. La animación luego solo mueve esos
 * bitmaps, así se mantiene fluida aunque los filtros sean costosos.
 *
 * Coordenadas del "mundo": 3200 × 3600. Cielo arriba, superficie del agua en
 * y = 1750, fondo marino abajo.
 */

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 3600;
export const SURFACE_Y = 1750;

/** Tamaño local del dibujo de un camarón (viewBox `-110 -20 300 130`). */
export const SHRIMP_ASPECT = 130 / 300;

export type Rng = () => number;

/** Generador pseudoaleatorio con semilla (mulberry32): el mismo dibujo en cada carga. */
export function createRng(seed: number): Rng {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const f1 = (n: number) => n.toFixed(1);

/** Altura de la superficie del agua en `x`: una ola suave. */
export const wave = (x: number) => SURFACE_Y + 9 * Math.sin(x / 95) + 5 * Math.sin(x / 41 + 1.3);

function waveD(x0: number, x1: number) {
	let d = `M${x0} ${f1(wave(x0))}`;
	for (let x = x0 + 20; x <= x1; x += 20) d += ` L${x} ${f1(wave(x))}`;
	return d;
}

/** Mancha orgánica cerrada alrededor de (cx, cy). */
export function blob(cx: number, cy: number, r: number, rng: Rng, n = 11, squash = 0.85) {
	const p: [number, number][] = [];
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2;
		const rr = r * (0.78 + 0.4 * rng());
		p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
	}
	const mid = (a: [number, number], b: [number, number]) => [
		(a[0] + b[0]) / 2,
		(a[1] + b[1]) / 2
	];
	const s = mid(p[n - 1], p[0]);
	let d = `M${f1(s[0])} ${f1(s[1])}`;
	for (let i = 0; i < n; i++) {
		const q = p[i];
		const e = mid(p[i], p[(i + 1) % n]);
		d += ` Q${f1(q[0])} ${f1(q[1])} ${f1(e[0])} ${f1(e[1])}`;
	}
	return `${d}Z`;
}

interface FilterOptions {
	/** Acuarela: frecuencia, desplazamiento, desenfoque y grano del pigmento. */
	wf: number;
	wd: number;
	wb: number;
	gf: number;
	/** Crayola: frecuencia del temblor, desplazamiento y grano. */
	cf: number;
	cd: number;
	cg: number;
}

const WORLD_FILTER: FilterOptions = {
	wf: 0.006,
	wd: 46,
	wb: 2.2,
	gf: 0.035,
	cf: 0.02,
	cd: 7,
	cg: 0.45
};
const LOCAL_FILTER: FilterOptions = { wf: 0.05, wd: 5, wb: 0.3, gf: 0.3, cf: 0.16, cd: 1, cg: 3.2 };

/** Define los filtros `#wc` (acuarela) y `#cr` (crayola) para un documento SVG. */
function filters(seed: number, o: FilterOptions) {
	return `<filter id="wc" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="${o.wf}" numOctaves="3" seed="${seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="${o.wd}" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feGaussianBlur in="d" stdDeviation="${o.wb}" result="b"/>
<feTurbulence type="fractalNoise" baseFrequency="${o.gf}" numOctaves="2" seed="${seed + 11}" result="g"/>
<feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 0 0 0 1.45" result="ga"/>
<feComposite in="b" in2="ga" operator="in"/></filter>
<filter id="cr" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="${o.cf}" numOctaves="2" seed="${seed + 5}" result="t"/>
<feDisplacementMap in="SourceGraphic" in2="t" scale="${o.cd}" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feTurbulence type="fractalNoise" baseFrequency="${o.cg}" numOctaves="1" seed="${seed + 9}" result="g"/>
<feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.2 0 0 0 2.2" result="m"/>
<feComposite in="d" in2="m" operator="in"/></filter>`;
}

function svgDoc(viewBox: string, width: number, height: number, defs: string, body: string) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" preserveAspectRatio="none"><defs>${defs}</defs>${body}</svg>`;
}

/* ---------- cielo ---------- */

export function skySvg(width: number, height: number) {
	const r = createRng(11);
	let wc = '';
	let cr = '';
	wc += `<rect x="-200" y="-200" width="3600" height="1100" fill="${C.oceano}" opacity=".13"/>`;
	wc += `<rect x="-200" y="-200" width="3600" height="560" fill="${C.oceano}" opacity=".09"/>`;
	wc += `<circle cx="2560" cy="430" r="150" fill="${C.arena}"/>`;
	for (let i = 0; i < 7; i++) {
		wc += `<path d="${blob(r() * 3200, 180 + r() * 420, 140 + r() * 200, r, 12, 0.32)}" fill="${C.blanco}" opacity=".7"/>`;
	}
	const ridge = (base: number, amp: number, phase: number) => {
		let d = `M-100 1800 L-100 ${base}`;
		for (let x = -100; x <= 3300; x += 100) {
			d += ` L${x} ${f1(base - amp * (0.5 + 0.5 * Math.sin(x / 340 + phase)) - r() * amp * 0.25)}`;
		}
		return `${d} L3300 1800Z`;
	};
	wc += `<path d="${ridge(1560, 150, 0)}" fill="${C.olivo}" opacity=".28"/>`;
	wc += `<path d="${ridge(1660, 90, 2)}" fill="${C.verde}" opacity=".22"/>`;
	for (let x = -60; x < 3300; x += 70) {
		wc += `<path d="${blob(x + r() * 30, 1700 - r() * 30, 45 + r() * 45, r, 9, 0.7)}" fill="${r() < 0.5 ? C.verde : C.olivo}" opacity=".45"/>`;
	}
	cr += `<circle cx="2560" cy="430" r="150" fill="none" stroke="${C.olivo}" stroke-width="5" opacity=".75"/>`;
	for (let i = 0; i < 9; i++) {
		const a = (i / 9) * Math.PI * 2;
		cr += `<path d="M${f1(2560 + Math.cos(a) * 185)} ${f1(430 + Math.sin(a) * 185)} L${f1(2560 + Math.cos(a) * 230)} ${f1(430 + Math.sin(a) * 230)}" stroke="${C.olivo}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
	}
	for (let i = 0; i < 7; i++) {
		const bx = 800 + r() * 1400;
		const by = 280 + r() * 380;
		const k = 0.7 + r() * 0.6;
		cr += `<path d="M${f1(bx)} ${f1(by)} q${f1(18 * k)} ${f1(-16 * k)} ${f1(36 * k)} 0 q${f1(18 * k)} ${f1(-16 * k)} ${f1(36 * k)} 0" fill="none" stroke="${C.oceano}" stroke-width="5" stroke-linecap="round"/>`;
	}
	return svgDoc(
		'0 0 3200 1800',
		width,
		height,
		filters(3, WORLD_FILTER),
		`<rect width="3200" height="1800" fill="${C.papel}"/><g filter="url(#wc)">${wc}</g><g filter="url(#cr)">${cr}</g>`
	);
}

/* ---------- agua ---------- */

export function waterSvg(width: number, height: number) {
	const r = createRng(21);
	let wc = '';
	let cr = '';
	const body = `${waveD(-40, 3240)} L3240 3640 L-40 3640Z`;
	const defs =
		filters(9, WORLD_FILTER) +
		`<linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.arena}" stop-opacity=".5"/><stop offset=".45" stop-color="${C.arena}" stop-opacity=".06"/><stop offset="1" stop-color="${C.verde}" stop-opacity=".4"/></linearGradient>`;
	wc += `<path d="${body}" fill="url(#lg)"/>`;
	const tints = [C.olivo, C.verde, C.oceano, C.arena];
	for (let i = 0; i < 28; i++) {
		wc += `<path d="${blob(r() * 3200, 1900 + r() * 1500, 120 + r() * 300, r, 10, 0.5)}" fill="${tints[i % 4]}" opacity="${(0.1 + r() * 0.14).toFixed(2)}"/>`;
	}
	for (let i = 0; i < 8; i++) {
		const x = r() * 3000;
		const w = 80 + r() * 160;
		const dx = 200 + r() * 200;
		wc += `<path d="M${f1(x)} 1760 L${f1(x + w)} 1760 L${f1(x + w + dx)} 3200 L${f1(x + dx - 60)} 3200Z" fill="${C.arena}" opacity=".08"/>`;
	}
	const bed = (base: number, amp: number) => {
		let d = `M-100 3640 L-100 ${base}`;
		for (let x = -100; x <= 3300; x += 120) {
			d += ` L${x} ${f1(base - amp * Math.sin(x / 260) - r() * amp)}`;
		}
		return `${d} L3300 3640Z`;
	};
	wc += `<path d="${bed(3450, 40)}" fill="${C.olivo}" opacity=".6"/><path d="${bed(3520, 30)}" fill="${C.carmesi}" opacity=".22"/>`;
	for (let i = 0; i < 70; i++) {
		const x = r() * 3200;
		const y = 1790 + Math.pow(r(), 2) * 700;
		const k = 0.6 + r();
		cr += `<path d="M${f1(x)} ${f1(y)} q${f1(12 * k)} ${f1(-9 * k)} ${f1(24 * k)} 0 t${f1(24 * k)} 0" fill="none" stroke="${C.arena}" stroke-width="4" opacity=".4" stroke-linecap="round"/>`;
	}
	for (let i = 0; i < 90; i++) {
		const x = r() * 3200;
		const y = 3470 + r() * 80;
		const h = 80 + r() * 220;
		const bend = (r() - 0.5) * 90;
		cr += `<path d="M${f1(x)} ${f1(y)} q${f1(bend * 0.3)} ${f1(-h * 0.5)} ${f1(bend)} ${f1(-h)}" fill="none" stroke="${r() < 0.5 ? C.olivo : C.verde}" stroke-width="7" stroke-linecap="round"/>`;
	}
	return svgDoc(
		'0 1700 3200 1900',
		width,
		height,
		defs,
		`<path d="${body}" fill="${C.oceano}"/><g filter="url(#wc)">${wc}</g><g filter="url(#cr)">${cr}</g>`
	);
}

/* ---------- manglar ---------- */

function tree(x: number, sc: number, r: Rng, back: boolean) {
	const R = 230 * sc;
	const cy = (back ? 1330 : 1260) + (r() - 0.5) * 60;
	const baseY = 1600 + (r() - 0.5) * 30;
	const lean = (r() - 0.5) * 40;

	// Raíces zancudas del mangle rojo: arcos que salen del tronco y bajan al agua.
	let roots = '';
	const rootCount = back ? 5 : 8;
	for (let i = 0; i < rootCount; i++) {
		const dir = i % 2 ? 1 : -1;
		const sy = (back ? 1490 : 1430) + r() * (back ? 110 : 170);
		const sx = x + lean * 0.6 + (r() - 0.5) * 16;
		const reach = (70 + r() * 280) * sc * dir;
		const ex = sx + reach;
		const ey = 1930 + r() * (back ? 70 : 150);
		const d = `M${f1(sx)} ${f1(sy)} C${f1(sx + reach * 0.55)} ${f1(sy - 50 * sc)} ${f1(ex)} ${f1(sy + (ey - sy) * 0.15)} ${f1(ex)} ${f1(ey)}`;
		roots += `<path d="${d}" stroke-width="${f1(9 * sc)}"/><path d="${d}" stroke-width="${f1(3 * sc)}" transform="translate(${f1(5 * sc)} 2)" opacity=".6"/>`;
	}

	const tw = 16 * sc;
	const ty = cy + R * 0.2;
	const trunk = `M${f1(x - tw)} ${f1(ty)} C${f1(x - tw)} ${f1(ty + 120)} ${f1(x + lean - tw * 1.2)} ${f1(baseY - 80)} ${f1(x + lean - tw * 1.3)} ${f1(baseY)} L${f1(x + lean + tw * 1.3)} ${f1(baseY)} C${f1(x + lean + tw * 1.2)} ${f1(baseY - 80)} ${f1(x + tw)} ${f1(ty + 120)} ${f1(x + tw)} ${f1(ty)}Z`;
	let branches = '';
	for (let j = 0; j < 3; j++) {
		branches += `<path d="M${f1(x)} ${f1(ty + 40)} q${f1((j - 1) * 60 * sc)} ${f1(-60 * sc)} ${f1((j - 1) * 130 * sc)} ${f1(-140 * sc)}"/>`;
	}

	let canopyWash = '';
	let canopyLines = '';
	const blobCount = back ? 6 : 9;
	for (let j = 0; j < blobCount; j++) {
		const bx = x + (r() - 0.5) * R * 1.5;
		const by = cy + (r() - 0.55) * R * 0.8;
		const rr = R * (0.42 + r() * 0.3);
		const d = blob(bx, by, rr, r, 11, 0.78);
		canopyWash += `<path d="${d}" fill="${j % 3 === 2 ? C.verde : C.olivo}" opacity="${j % 3 === 2 ? 0.75 : 0.85}"/>`;
		canopyLines += `<path d="${d}" stroke-dasharray="${f1(rr * 1.4)} ${f1(rr * 0.35)} ${f1(rr * 0.8)} ${f1(rr * 0.5)}"/>`;
	}
	for (let j = 0; j < 3; j++) {
		canopyWash += `<path d="${blob(x - R * 0.3 + (r() - 0.5) * R * 0.6, cy - R * 0.35 + (r() - 0.5) * R * 0.3, R * 0.22, r, 9, 0.7)}" fill="${C.arena}" opacity=".3"/>`;
	}
	for (let j = 0; j < (back ? 10 : 22); j++) {
		const px = x + (r() - 0.5) * R * 1.6;
		const py = cy + (r() - 0.6) * R * 0.9;
		canopyLines += `<path d="M${f1(px)} ${f1(py)} l${f1(12 * sc)} ${f1(-9 * sc)}" stroke-width="${f1(4 * sc)}"/>`;
	}
	let propagules = '';
	for (let j = 0; j < (back ? 3 : 6); j++) {
		const px = x + (r() - 0.5) * R * 1.2;
		const py = cy + R * 0.35 + r() * 30;
		propagules += `<path d="M${f1(px)} ${f1(py)} l2 ${f1(40 * sc)}"/>`;
	}

	const rootGroup = `<g filter="url(#cr)" fill="none" stroke="${C.carmesi}" stroke-linecap="round">${roots}</g>`;
	return `<g opacity="${back ? 0.72 : 1}">
<g clip-path="url(#below)" opacity=".42">${rootGroup}</g>
<g clip-path="url(#above)">${rootGroup}</g>
<g filter="url(#wc)"><path d="${trunk}" fill="${C.carmesi}" opacity=".75"/><g fill="none" stroke="${C.carmesi}" stroke-width="${f1(7 * sc)}" stroke-linecap="round">${branches}</g>${canopyWash}</g>
<g filter="url(#cr)" fill="none" stroke-linecap="round"><path d="${trunk}" stroke="${C.carmesi}" stroke-width="${f1(4 * sc)}"/><g stroke="${C.verde}" stroke-width="${f1(5 * sc)}">${canopyLines}</g><g stroke="${C.olivo}" stroke-width="${f1(6 * sc)}">${propagules}</g></g>
</g>`;
}

let mangroveBodyCache: string | null = null;

function mangroveBody() {
	if (mangroveBodyCache) return mangroveBodyCache;
	const r = createRng(31);
	const back: [number, number][] = [
		[480, 0.7],
		[1000, 0.62],
		[1580, 0.72],
		[2200, 0.66],
		[2760, 0.7],
		[3120, 0.6]
	];
	const front: [number, number][] = [
		[200, 1.05],
		[760, 0.95],
		[1300, 1.2],
		[1920, 1.0],
		[2480, 1.15],
		[3020, 0.95]
	];
	let s = '';
	for (const [x, sc] of back) s += tree(x + (r() - 0.5) * 80, sc, r, true);
	for (const [x, sc] of front) s += tree(x + (r() - 0.5) * 80, sc, r, false);
	let ripples = '';
	for (let i = 0; i < 40; i++) {
		const x = r() * 3200;
		ripples += `<path d="M${f1(x)} ${f1(wave(x) + 8 + r() * 10)} q${f1(25 + r() * 20)} 7 ${f1(55 + r() * 30)} 0"/>`;
	}
	s += `<g filter="url(#cr)" fill="none" stroke-linecap="round"><path d="${waveD(-40, 3240)}" stroke="${C.arena}" stroke-width="7"/><path d="${waveD(-40, 3240)}" stroke="${C.papel}" stroke-width="3" stroke-dasharray="60 40 20 50" transform="translate(0 12)" opacity=".8"/><g stroke="${C.arena}" stroke-width="4" opacity=".7">${ripples}</g></g>`;
	mangroveBodyCache = s;
	return s;
}

/** Manglar con raíces; `seed` cambia solo el temblor del trazo (para el efecto de línea viva). */
export function mangroveSvg(seed: number, width: number, height: number) {
	const clips = `<clipPath id="above"><path d="${waveD(-40, 3240)} L3240 600 L-40 600Z"/></clipPath><clipPath id="below"><path d="${waveD(-40, 3240)} L3240 2200 L-40 2200Z"/></clipPath>`;
	return svgDoc(
		'0 700 3200 1400',
		width,
		height,
		filters(seed, WORLD_FILTER) + clips,
		mangroveBody()
	);
}

/* ---------- camarón ---------- */

const SHRIMP_BODY =
	'M10 46 C14 30 44 22 78 24 C112 26 146 34 166 52 C180 64 182 80 172 88 C166 93 158 90 156 84 C150 70 136 62 116 60 C92 58 64 64 40 64 C24 64 8 58 10 46Z';
const SHRIMP_TAIL =
	'M160 84 C150 96 148 108 156 110 C160 104 164 100 166 96 C170 104 178 108 182 102 C180 94 174 88 168 86Z';

/** Camarón mirando a la izquierda. `pose` (-1…1) mueve patas, cola y antenas. */
export function shrimpSvg(seed: number, pose: number, width: number, height: number) {
	const tail = `rotate(${pose * 7} 164 86)`;
	let legs = '';
	for (let i = 0; i < 5; i++) {
		const x = 28 + i * 10;
		legs += `M${x} 62 l${f1(-5 + pose * 4 - i)} ${f1(16 + i * 0.5)} l-3 4 `;
	}
	let swimmerets = '';
	for (const x of [96, 114, 132, 148])
		swimmerets += `M${x} ${x < 140 ? 60 : 65} l${f1(3 + pose * 4)} 12 `;

	const wash = `<path d="${SHRIMP_BODY}" fill="${C.arena}"/><path d="M20 36 C60 22 124 26 162 48 L164 58 C126 38 62 34 22 46Z" fill="${C.carmesi}" opacity=".28"/><path d="M40 62 C70 58 110 56 150 72 L156 84 C130 66 90 64 44 66Z" fill="${C.blanco}" opacity=".4"/><g transform="${tail}"><path d="${SHRIMP_TAIL}" fill="${C.carmesi}" opacity=".45"/></g>`;
	const lines = `<path d="${SHRIMP_BODY}"/><path d="M74 25 C70 40 70 52 74 62"/><path d="M98 26 C95 40 96 52 100 59"/><path d="M120 30 C118 42 119 52 123 61"/><path d="M140 37 C140 47 141 56 145 64"/><path d="M156 47 C158 55 160 62 160 70"/><g transform="${tail}"><path d="${SHRIMP_TAIL}"/><path d="M165 90 L160 106 M168 90 L176 103"/></g><path d="M12 42 C0 36 -12 34 -24 35 M-2 36 l2 -4 M-10 35 l2 -4"/><path d="M16 40 C-20 ${16 + pose * 3} -60 ${12 + pose * 4} -102 ${f1(-6 + pose * 8)}" stroke-width="1.6"/><path d="M16 45 C-24 ${40 + pose * 2} -60 ${54 - pose * 3} -104 ${f1(64 - pose * 8)}" stroke-width="1.6"/><path d="M18 42 C4 30 -10 26 -28 ${22 + pose * 2}" stroke-width="1.6"/><path d="${legs}" stroke-width="1.8"/><path d="${swimmerets}" stroke-width="1.8"/>`;
	return svgDoc(
		'-110 -20 300 130',
		width,
		height,
		filters(seed, LOCAL_FILTER),
		`<g filter="url(#wc)">${wash}</g><g filter="url(#cr)" fill="none" stroke="${C.carmesi}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${lines}</g><circle cx="24" cy="40" r="4.2" fill="${C.verde}"/><circle cx="22.8" cy="38.8" r="1.2" fill="${C.blanco}"/>`
	);
}

/* ---------- rasterizado ---------- */

/** Dibuja un SVG en un canvas del tamaño dado (los filtros se calculan una sola vez aquí). */
export function rasterize(svg: string, width: number, height: number) {
	return new Promise<HTMLCanvasElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
			resolve(canvas);
		};
		img.onerror = () => reject(new Error('No se pudo dibujar una capa de la intro'));
		img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	});
}

export interface IntroArt {
	sky: HTMLCanvasElement;
	water: HTMLCanvasElement;
	/** Dos versiones del manglar con distinto temblor, alternadas para que la línea "hierva". */
	mangrove: [HTMLCanvasElement, HTMLCanvasElement];
	/** Tres poses del camarón del cardumen. */
	shrimp: HTMLCanvasElement[];
	/** Las mismas poses a mayor resolución para el primer plano. */
	hero: HTMLCanvasElement[];
}

export async function loadIntroArt(): Promise<IntroArt> {
	const poses = [0, 1, 2];
	const [sky, water, mangroveA, mangroveB, ...shrimpFrames] = await Promise.all([
		rasterize(skySvg(2400, 1350), 2400, 1350),
		rasterize(waterSvg(2400, 1425), 2400, 1425),
		rasterize(mangroveSvg(13, 2400, 1050), 2400, 1050),
		rasterize(mangroveSvg(17, 2400, 1050), 2400, 1050),
		...poses.map(i => rasterize(shrimpSvg(40 + i, i - 1, 600, 260), 600, 260)),
		...poses.map(i => rasterize(shrimpSvg(60 + i, i - 1, 1200, 520), 1200, 520))
	]);
	return {
		sky,
		water,
		mangrove: [mangroveA, mangroveB],
		shrimp: shrimpFrames.slice(0, 3),
		hero: shrimpFrames.slice(3)
	};
}
