export type Layer = 'clases' | 'rgb' | 'estado' | 'if_alta' | 'if_baja' | 'sens_db_m';
/** Capas en el orden del selector; sus nombres están en `textos.ts`. */
export const LAYERS: Layer[] = ['clases', 'rgb', 'estado', 'if_alta', 'if_baja', 'sens_db_m'];
export type MapStatus = { key: string; loading: boolean; error: boolean };
