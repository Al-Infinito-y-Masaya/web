import type { DatosPartitura } from '@/features/partitura/partitura';

import type { Manifest } from './data';

/** A presentation adapter, not a conversion to the legacy scientific contract. */
export function timelineData(manifest: Manifest): DatosPartitura {
	return {
		region: { zona_horaria: 'America/Managua' },
		brechas: [], // This export does not publish instrument-gap annotations.
		umbrales: {}, // No rainfall measurement or exclusion is invented.
		fechas: manifest.fechas.map(d => ({
			id: d.fecha_id,
			fecha_hora: d.hora_utc,
			track: d.pista,
			orbita: d.direccion,
			crid: d.crid,
			marea_m: d.marea_m,
			marea_nivel: d.marea_nivel,
			lluvia_3d_mm: null,
			usada_en_if_alta: d.marea_nivel === 'alta',
			capas: {}
		}))
	};
}
