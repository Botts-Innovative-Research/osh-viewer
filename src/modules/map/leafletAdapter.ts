import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import { MapClickHandler } from './composables/useMap';

export function createLeafletMap(container: string) {
	const map = new LeafletView({
		container,
		layers: [],
		autoZoomOnFirstMarker: true,
	});
	return map;
}

export function handleLeafletClick(map: any, onClick: MapClickHandler) {
	map.map.on('click', (event: any) => {
		const lat = event.latlng.lat;
		const lon = event.latlng.lng;
		onClick(lat, lon, 120);
	});
}

export function setLeafletCursor(map: any, mode: string) {
  if (mode === 'default') mode = '';
  map.map.getContainer().style.cursor = mode;
}
