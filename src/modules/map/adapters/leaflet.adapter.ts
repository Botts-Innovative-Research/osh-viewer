import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter, MapClickHandler, MapPoint } from './types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: LeafletView | null;
	let flightPathPolyline: any = null;

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

	function addFOILayer(markerProps: any) {
		const markerEnt = mapView.addMarker(markerProps, undefined);
		mapView.addMarkerToLayer(markerEnt, markerProps);
	}

	function toggleLayerVisibility(id: string, isVisible: boolean) {
		const marker = mapView.layerIdToMarkers?.[id];
		const polyline = mapView.layerIdToPolylines?.[id];

		// Handle PM and LoB
		if (marker) {
			marker.setOpacity(isVisible ? mapView.getLayer(id).properties.iconOpacity : 0);
		}
		// Handle polyline
		if (polyline) {
			polyline.setStyle({ opacity: isVisible ? mapView.getLayer(id).properties.opacity : 0 });
		}
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

	return {
		init,
		destroy,
		addLayer,
		removeLayer,
		toggleLayerVisibility,
		setCursor,
		onClick,
		flyToPoint,
		updateMarker,
		drawMissionPath,
		clearMissionPath,
		addFOILayer,
	};
}
