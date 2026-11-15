import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ExperimentalApp } from './app';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ExperimentalApp />
	</StrictMode>
);
