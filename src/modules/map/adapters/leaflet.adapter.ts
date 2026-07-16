import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter, MapClickHandler, MapMoveHandler, MapPoint } from './types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: typeof LeafletView | null;
	let flightPathPolyline: any = null;
	let previewLinePolyline: any = null;

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

	async function removeLayer(layer: any): Promise<void> {
		mapView.removeAllFromLayer(layer);
		return;
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

	function flyToPoint(location: { x: number; y: number; z: number }) {
		mapView.map.flyTo([location.y, location.x]);
	}

	function updateMarker(props: any) {
		mapView.updateMarker(props);
	}

	function drawMissionPath(waypoints: MapPoint[]) {
		clearMissionPath();
		const latLngs = waypoints.map((wp: MapPoint) => [wp.lat, wp.lon]);
		flightPathPolyline = L.polyline(latLngs, {
			color: 'blue',
			weight: 5,
		}).addTo(mapView.map);
	}

	function clearMissionPath() {
		if (!flightPathPolyline) return;
		mapView.map.removeLayer(flightPathPolyline);
		flightPathPolyline = null;
	}

	function onMouseMove(handler: MapMoveHandler) {
		const moveFn = (e: any) => {
			handler(e.latlng.lat, e.latlng.lng, 0);
		};
		mapView.map.on('mousemove', moveFn);
		return () => {
			mapView.map.off('mousemove', moveFn);
		};
	}

	function drawPreviewLine(from: MapPoint, to: MapPoint) {
		clearPreviewLine();
		previewLinePolyline = L.polyline(
			[
				[from.lat, from.lon],
				[to.lat, to.lon],
			],
			{
				color: 'blue',
				weight: 3,
				opacity: 0.7,
				dashArray: '10, 10',
			}
		).addTo(mapView.map);
	}

	function clearPreviewLine() {
		if (!previewLinePolyline) return;
		mapView.map.removeLayer(previewLinePolyline);
		previewLinePolyline = null;
	}

	return {
		init,
		destroy,
		addLayer,
		removeLayer,
		setCursor,
		onClick,
		flyToPoint,
		updateMarker,
		drawMissionPath,
		clearMissionPath,
		onMouseMove,
		drawPreviewLine,
		clearPreviewLine,
	};
}
