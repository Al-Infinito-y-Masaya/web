/** Filtros SVG de trazo de crayola para texto HTML: `filter: url(#intro-crayon-a)`. */
export const CRAYON_FILTER_IDS = ['intro-crayon-a', 'intro-crayon-b'] as const;

const SEEDS = [
	[2, 4],
	[7, 9]
] as const;

export function CrayonFilters() {
	return (
		<svg width="0" height="0" className="absolute" aria-hidden="true">
			{CRAYON_FILTER_IDS.map((id, i) => (
				<filter key={id} id={id} x="-5%" y="-15%" width="110%" height="130%">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.035"
						numOctaves={2}
						seed={SEEDS[i][0]}
						result="t"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="t"
						scale={5}
						xChannelSelector="R"
						yChannelSelector="G"
						result="d"
					/>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.85"
						numOctaves={1}
						seed={SEEDS[i][1]}
						result="g"
					/>
					<feColorMatrix
						in="g"
						type="matrix"
						values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.6 0 0 0 2"
						result="m"
					/>
					<feComposite in="d" in2="m" operator="in" />
				</filter>
			))}
		</svg>
	);
}
