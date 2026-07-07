import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter } from './types';
import { MapPoint, MapPointHandler } from '@/modules/map/types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: typeof LeafletView | null;
	let flightPathPolyline: any = null;

	/* Geofence previews */
	let previewCircle: L.Circle | null = null;
	/* Geofence entities */
	let geofenceEntities: any[] = [];

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

	function onClick(handler: MapPointHandler) {
		const clickFn = (e: any) => {
			handler(e.latlng.lat, e.latlng.lng, 120);
		};

		mapView.map.on('click', clickFn);

		return () => {
			mapView.map.off('click', clickFn);
		};
	}

	function onMouseMove(handler: MapPointHandler) {
		const moveFn = (e: any) => {
			handler(e.latlng.lat, e.latlng.lng, 120);
		};

		mapView.map.on('mousemove', moveFn);

		return () => {
			mapView.map.off('mousemove', moveFn);
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
			color: 'red',
			weight: 5,
		}).addTo(mapView.map);
	}

	function clearMissionPath() {
		if (!flightPathPolyline) return;
		mapView.map.removeLayer(flightPathPolyline);
		flightPathPolyline = null;
	}

	/* Geofence Drawing Tools */
	function handleCirclePreviewClick(center: MapPoint) {
		if (previewCircle) endCirclePreview();
		else {
			previewCircle = L.circle([center.lat, center.lon], {
				color: 'blue',
				weight: 2,
				fillColor: 'lightblue',
				fillOpacity: 0.5,
				radius: 0,
			}).addTo(mapView.map);
		}
	}

	function updateCirclePreview(mouse: MapPoint) {
		if (!previewCircle) return;
		const radius = L.latLng(
			previewCircle.getLatLng().lat,
			previewCircle.getLatLng().lng
		).distanceTo(L.latLng(mouse.lat, mouse.lon));
		previewCircle.setRadius(radius);
	}

	function endCirclePreview() {
		if (!previewCircle) return;
		mapView.map.removeLayer(previewCircle);
		drawCircleGeofence(
			{ lat: previewCircle.getLatLng().lat, lon: previewCircle.getLatLng().lng, alt: 120 },
			previewCircle.getRadius()
		);
		previewCircle = null;
	}

	function drawCircleGeofence(center: MapPoint, radius: number) {
		const newCircle = L.circle([center.lat, center.lon], {
			radius,
			color: 'blue',
			weight: 2,
			fillColor: 'lightcoral',
			fillOpacity: 0.5,
		});
		newCircle.addTo(mapView.map);
		geofenceEntities.push(newCircle);
	}

	return {
		init,
		destroy,
		addLayer,
		removeLayer,
		setCursor,
		onClick,
		onMouseMove,
		flyToPoint,
		updateMarker,
		drawMissionPath,
		clearMissionPath,
		handleCirclePreviewClick,
		updateCirclePreview,
		endCirclePreview,
		drawCircleGeofence,
	};
}
