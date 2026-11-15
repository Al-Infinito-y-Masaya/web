export type Layer = 'clases' | 'rgb' | 'estado' | 'if_alta' | 'if_baja' | 'sens_db_m';
export const layerLabels: Record<Layer, string> = {
	clases: 'Inundación por fecha',
	rgb: 'Radar HH / HV',
	estado: 'Patrón de inundación',
	if_alta: 'Frecuencia en marea alta',
	if_baja: 'Frecuencia en marea baja',
	sens_db_m: 'Respuesta HH a la marea'
};
export type MapStatus = { key: string; loading: boolean; error: boolean };
