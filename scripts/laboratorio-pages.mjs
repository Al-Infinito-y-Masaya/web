// Mete la compilación del laboratorio de estuarios dentro de dist/ para GitHub Pages.
// Pages no reescribe rutas: cada sitio necesita su propia carpeta con el index.html
// del laboratorio, y los assets ya usan la base absoluta /laboratorio/.
import fs from 'node:fs';
import path from 'node:path';

const SITIOS = ['chismuyo', 'aserradores', 'padre_ramos'];

const origen = path.resolve('dist-experimental');
const destino = path.resolve('dist', 'laboratorio');
const indice = path.join(origen, 'index.html');

if (!fs.existsSync(indice)) {
	console.error('Falta dist-experimental/index.html: corré pnpm build:experimental primero.');
	process.exit(1);
}

fs.rmSync(destino, { recursive: true, force: true });
fs.cpSync(origen, destino, { recursive: true });
// El dominio lo declara solo la raíz del sitio.
fs.rmSync(path.join(destino, 'CNAME'), { force: true });

for (const sitio of SITIOS) {
	fs.mkdirSync(path.join(destino, sitio), { recursive: true });
	fs.copyFileSync(indice, path.join(destino, sitio, 'index.html'));
}

console.log(`Laboratorio copiado en dist/laboratorio (${SITIOS.join(', ')}).`);
