import type { CSSProperties } from 'react';

import { cn } from '@/shared/utils/index';

import { ISOTYPE_CIRCLE, ISOTYPE_PATHS, ISOTYPE_VIEWBOX } from './isotype-paths';

interface IsotypeProps {
	className?: string;
	style?: CSSProperties;
}

/**
 * Isotipo dentro de un círculo claro. Cada trazo empieza oculto
 * (`stroke-dashoffset: 1`) para que la intro lo dibuje con `data-iso-path`.
 */
export function Isotype({ className, style }: IsotypeProps) {
	return (
		<svg
			viewBox={ISOTYPE_VIEWBOX}
			role="img"
			aria-label="Isotipo de Mangroove"
			className={cn('h-auto overflow-visible', className)}
			style={style}
		>
			<circle
				data-iso-bg
				{...ISOTYPE_CIRCLE}
				strokeWidth={4}
				className="[transform-origin:center] fill-manglar-papel stroke-manglar-olivo [transform-box:fill-box]"
			/>
			{ISOTYPE_PATHS.map(d => (
				<path
					key={d.slice(0, 24)}
					data-iso-path
					d={d}
					pathLength={1}
					strokeWidth={1.8}
					strokeLinejoin="round"
					strokeDasharray={1}
					strokeDashoffset={1}
					fillOpacity={0}
					className="fill-manglar-olivo stroke-manglar-olivo"
				/>
			))}
		</svg>
	);
}
