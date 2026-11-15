import { Component, type ReactNode } from 'react';

export class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? (
			<div className="exp-map-message" role="alert">
				No se pudo iniciar el mapa. Comprobá la conexión y volvé a intentarlo.
				<button className="boton boton-contorno" onClick={() => window.location.reload()}>
					Volver a cargar
				</button>
			</div>
		) : (
			this.props.children
		);
	}
}
