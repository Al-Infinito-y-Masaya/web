import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/utils/index';

import { loadIntroArt } from './art';
import { CRAYON_FILTER_IDS, CrayonFilters } from './crayon-filters';
import { Isotype } from './isotype';
import { createIntroScene, type IntroScene } from './scene';

const TITLE = 'mangroove';
/** Las dos "o" de *groove* van en olivo. */
const ACCENT_LETTERS = new Set([5, 6]);
const SOFT_SHADOW = '[text-shadow:0_1px_2px_rgb(13_59_22/0.75),0_0_14px_rgb(35_62_69/0.6)]';

type Status = 'loading' | 'playing' | 'done' | 'error';

interface IntroControls {
	skip(): void;
	replay(): void;
}

/** Ruido cálido en mosaico que imita la textura del papel. */
function createPaperTexture() {
	const size = 180;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	const image = ctx.createImageData(size, size);
	for (let i = 0; i < image.data.length; i += 4) {
		const v = 200 + Math.random() * 55;
		image.data[i] = v;
		image.data[i + 1] = v - 6;
		image.data[i + 2] = v - 16;
		image.data[i + 3] = 255;
	}
	ctx.putImageData(image, 0, 0);
	return canvas.toDataURL();
}

/**
 * Intro animada de Mangroove: primer plano de un camarón, el cardumen, la
 * cámara sale del agua al manglar y se escribe el nombre letra por letra.
 * Con `prefers-reduced-motion` se muestra directamente la escena final.
 */
export function IntroScreen() {
	const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	const rootRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const controlsRef = useRef<IntroControls | null>(null);
	const [status, setStatus] = useState<Status>('loading');
	const [paperTexture] = useState(createPaperTexture);

	useEffect(() => {
		const root = rootRef.current;
		const canvas = canvasRef.current;
		const title = titleRef.current;
		if (!root || !canvas || !title) return;

		let cancelled = false;
		let scene: IntroScene | null = null;
		let gsapContext: gsap.Context | null = null;
		let dance: gsap.core.Tween | null = null;
		let boilTimer: number | undefined;

		// Al terminar, las letras "bailan" y el trazo tiembla como dibujado a mano.
		const startDance = () => {
			if (reducedMotion || dance) return;
			dance = gsap.to(root.querySelectorAll('[data-letter]'), {
				y: -7,
				duration: 0.42,
				ease: 'sine.inOut',
				stagger: { each: 0.08, repeat: -1, yoyo: true }
			});
			let alternate = false;
			boilTimer = window.setInterval(() => {
				alternate = !alternate;
				title.style.filter = `url(#${CRAYON_FILTER_IDS[alternate ? 1 : 0]})`;
			}, 140);
		};
		const stopDance = () => {
			dance?.kill();
			dance = null;
			window.clearInterval(boilTimer);
			gsap.set(root.querySelectorAll('[data-letter]'), { y: 0 });
		};

		loadIntroArt()
			.then(art => {
				if (cancelled) return;
				const introScene = createIntroScene(canvas, art, { reducedMotion });
				scene = introScene;

				gsapContext = gsap.context(() => {
					const finish = () => {
						setStatus('done');
						startDance();
					};

					const titleTimeline = gsap
						.timeline()
						.fromTo('[data-title-bg]', { opacity: 0 }, { opacity: 1, duration: 0.5 })
						.fromTo(
							'[data-letter]',
							{
								clipPath: 'inset(-25% 100% -25% 0%)',
								y: 22,
								rotate: () => gsap.utils.random(-9, 9)
							},
							{
								clipPath: 'inset(-25% 0% -25% 0%)',
								y: 0,
								rotate: 0,
								duration: 0.42,
								ease: 'power2.out',
								stagger: 0.17
							},
							'<0.15'
						)
						.fromTo(
							'[data-intro-fade]',
							{ opacity: 0, y: 10 },
							{ opacity: 1, y: 0, duration: 0.7, stagger: 0.15 },
							'-=.2'
						)
						.fromTo(
							'[data-iso-bg]',
							{ scale: 0 },
							{ scale: 1, duration: 0.55, ease: 'back.out(1.6)' },
							'-=.4'
						)
						.fromTo(
							'[data-iso-path]',
							{ strokeDashoffset: 1, fillOpacity: 0 },
							{
								strokeDashoffset: 0,
								duration: 1.4,
								ease: 'power1.inOut',
								stagger: 0.06
							},
							'-=.15'
						)
						.to(
							'[data-iso-path]',
							{ fillOpacity: 1, duration: 0.6, ease: 'power1.out', stagger: 0.03 },
							'-=.5'
						)
						.fromTo(
							'[data-intro-team]',
							{ opacity: 0, y: 8 },
							{ opacity: 1, y: 0, duration: 0.6, ease: 'power1.out' },
							'-=.4'
						);

					const { progress } = introScene;
					const timeline = gsap
						.timeline({ paused: true, onComplete: finish })
						.to(progress, { closeUp: 1, duration: 2.9, ease: 'sine.inOut' })
						.to(progress, { school: 1, duration: 3.2, ease: 'power2.inOut' }, '-=0.4')
						.to(progress, { rise: 1, duration: 3.1, ease: 'power3.inOut' }, '-=0.6')
						.add(titleTimeline, '-=0.5');

					controlsRef.current = {
						skip: () => {
							timeline.progress(1);
							finish();
						},
						replay: () => {
							stopDance();
							introScene.restart();
							setStatus('playing');
							timeline.restart();
						}
					};

					if (reducedMotion) {
						timeline.progress(1);
						finish();
					} else {
						setStatus('playing');
						timeline.play(0);
					}
				}, root);
			})
			.catch(() => {
				if (!cancelled) setStatus('error');
			});

		return () => {
			cancelled = true;
			stopDance();
			gsapContext?.revert();
			scene?.destroy();
			controlsRef.current = null;
		};
	}, [reducedMotion]);

	const handleButton = () => {
		if (status === 'done') controlsRef.current?.replay();
		else controlsRef.current?.skip();
	};

	return (
		<div
			ref={rootRef}
			className="fixed inset-0 overflow-hidden bg-manglar-oceano font-mangroove-body text-manglar-verde"
		>
			<CrayonFilters />
			<canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
				style={
					paperTexture
						? { backgroundImage: `url(${paperTexture})`, backgroundSize: '180px 180px' }
						: undefined
				}
			/>

			<header className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+7vh)] flex flex-col items-center gap-2.5 px-4 text-center">
				<p
					data-intro-fade
					className="text-[13px] font-medium tracking-[0.14em] text-manglar-oceano uppercase opacity-0"
				>
					NASA Space Apps 2026 · Dancing with the SARs
				</p>
				<div className="relative isolate text-[clamp(58px,12.5vw,190px)]">
					{/* Fondo claro difuminado para que el manglar no se coma el título. */}
					<div
						data-title-bg
						aria-hidden="true"
						className="absolute -inset-x-[0.3em] -top-[0.04em] -bottom-[0.2em] -z-10 rounded-[0.4em] bg-manglar-papel/80 opacity-0 blur-[10px]"
					/>
					<h1
						ref={titleRef}
						aria-label="Mangroove"
						className="font-mangroove-display leading-[0.95] font-bold tracking-[-0.01em] lowercase"
						style={{ filter: `url(#${CRAYON_FILTER_IDS[0]})` }}
					>
						{TITLE.split('').map((letter, i) => (
							<span
								key={i}
								data-letter
								aria-hidden="true"
								className={cn(
									'inline-block [clip-path:inset(-25%_100%_-25%_0)]',
									ACCENT_LETTERS.has(i) && 'text-manglar-olivo'
								)}
							>
								{letter}
							</span>
						))}
					</h1>
				</div>
				<p
					data-intro-fade
					className={cn(
						'mt-1 max-w-[36ch] text-[clamp(16px,1.6vw,20px)] leading-[1.45] font-medium text-balance text-manglar-papel opacity-0',
						SOFT_SHADOW
					)}
				>
					Escuchamos el pulso de la marea en el manglar del Estero Real con el radar del
					satélite NISAR.
				</p>
				<Isotype
					className="mt-1.5 w-[clamp(100px,12vw,170px)]"
					style={{
						filter: `url(#${CRAYON_FILTER_IDS[0]}) drop-shadow(0 2px 6px rgb(13 59 22 / 0.45))`
					}}
				/>
				<p
					data-intro-team
					className={cn(
						'mt-[18px] text-[clamp(15px,1.4vw,18px)] font-medium tracking-[0.08em] text-manglar-papel opacity-0',
						SOFT_SHADOW
					)}
				>
					Al infinito y Masaya
				</p>
			</header>

			<footer className="absolute inset-x-0 bottom-0 flex justify-end px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
				<button
					type="button"
					onClick={handleButton}
					disabled={status === 'loading' || status === 'error'}
					className="-rotate-1 rounded-[3px_6px_4px_7px] border-2 border-manglar-verde bg-manglar-papel px-[18px] py-[11px] text-[15px] leading-none font-medium text-manglar-verde transition-transform hover:scale-105 hover:rotate-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-manglar-arena disabled:opacity-60"
				>
					{status === 'done' ? 'Ver de nuevo' : 'Saltar intro'}
				</button>
			</footer>

			<div
				role="status"
				className={cn(
					'absolute inset-0 grid place-items-center bg-manglar-oceano font-mangroove-display text-[clamp(20px,3vw,30px)] text-manglar-arena lowercase transition-opacity duration-700',
					status !== 'loading' && status !== 'error' && 'pointer-events-none opacity-0'
				)}
			>
				{status === 'error'
					? 'no se pudieron preparar los dibujos'
					: 'mezclando las acuarelas…'}
			</div>
		</div>
	);
}
