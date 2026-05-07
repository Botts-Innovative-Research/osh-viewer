import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import { MapAdapter, MapClickHandler } from './types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: LeafletView | null;

	async function init(container: string) {
		mapView = new LeafletView({
			container,
			layers: [],
			autoZoomOnFirstMarker: true,
		});
	}

	function destroy() {
		mapView?.destroy();
		mapView = null;
	}

	function addLayer(layer: any) {
		mapView.addLayer(layer);
	}

	function removeLayer(layer: any) {
		mapView.removeAllFromLayer(layer);
	}

	function setCursor(mode: any) {
		mapView.map.getContainer().style.cursor = mode;
	}

	function onClick(handler: MapClickHandler) {
		const clickFn = (e: any) => {
			handler(e.latlng.lat, e.latlng.lng, 120);
		};

		mapView.map.on('click', clickFn);

		return () => {
			mapView.map.off('click', clickFn);
		};
	}

	function flyToPoint(location: { x: number, y: number, z: number }) {
		mapView.map.flyTo([
			location.y,
			location.x,
		]);
	}

	return {
		init,
		destroy,
		addLayer,
		removeLayer,
		setCursor,
		onClick,
		flyToPoint,
	};
}
