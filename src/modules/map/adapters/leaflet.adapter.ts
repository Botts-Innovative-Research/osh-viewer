import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import { MapAdapter, MapClickHandler } from './types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: any;

	return {
		async init(container) {
			mapView = new LeafletView({
				container,
				layers: [],
				autoZoomOnFirstMarker: true,
			});
		},

		destroy() {
			mapView?.destroy();
			mapView = null;
		},

		addLayer(layer) {
			mapView.addLayer(layer);
		},

		removeLayer(layer) {
			mapView.removeAllFromLayer(layer);
		},

		setCursor(mode) {
			mapView.map.getContainer().style.cursor = mode;
		},

		onClick(handler: MapClickHandler) {
			const clickFn = (e: any) => {
				handler(e.latlng.lat, e.latlng.lng, 120);
			};

			mapView.map.on('click', clickFn);

			return () => {
				mapView.map.off('click', clickFn);
			};
		},
	}
}