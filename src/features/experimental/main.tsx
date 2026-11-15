import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { IdiomaProvider } from '@/features/idioma/idioma';

import { ExperimentalApp } from './app';

import '@/app/globals.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<IdiomaProvider>
			<ExperimentalApp />
		</IdiomaProvider>
	</StrictMode>
);
