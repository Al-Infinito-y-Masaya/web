import { Component, type ReactNode } from 'react';

import { useLab } from './textos';

function MapaNoInicia() {
	const { t } = useLab();
	return (
		<div className="exp-map-message" role="alert">
			{t.mapa.noInicia}
			<button className="boton boton-contorno" onClick={() => window.location.reload()}>
				{t.mapa.recargar}
			</button>
		</div>
	);
}

export class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? <MapaNoInicia /> : this.props.children;
	}
}
