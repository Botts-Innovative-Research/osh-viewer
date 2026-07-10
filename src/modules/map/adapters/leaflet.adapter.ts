import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter } from './types';
import { MapPoint, MapPointHandler } from '@/modules/map/types';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: typeof LeafletView | null;
	let flightPathPolyline: any = null;

	/* Geofence previews */
	const previewStore = useGeoOverlayPreviewStore();
	let previewCircle: L.circle | null = null;
	let previewLinePoints: L.polyline | L.polygon | null = null;
	let previewEntity: any = null;
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

	function drawPoint(point: MapPoint): L.point {}
	function drawCircle(center: MapPoint, radius: number): L.circle {}
	function drawPolyline(points: MapPoint[], borderColor: string | null): L.polyline {
		return L.polyline(
			points.map((p) => [p.lat, p.lon]),
			{ color: borderColor ?? 'red', weight: 5 }
		);
	}
	function drawPolygon(
		points: MapPoint[],
		borderColor: string | null,
		fillColor: string | null
	): L.polygon {}

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
		drawCircleGeoOverlay(
			{ lat: previewCircle.getLatLng().lat, lon: previewCircle.getLatLng().lng, alt: 120 },
			previewCircle.getRadius()
		);
		previewCircle = null;
	}

	function drawCircleGeoOverlay(center: MapPoint, radius: number) {
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

	function updatePolylinePreview(points: MapPoint[], borderColor: string | null) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawPolyline(points, borderColor);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	function addPolygonPointPreview(point: MapPoint) {
		if (previewLinePoints) clearPreview();
		previewLinePoints = L.polygon(
			previewStore.points.map((p) => [p.lat, p.lon]),
			{ color: 'red', weight: 5 }
		);
		previewLinePoints.addTo(mapView.map);
	}

	function clearPreview() {
		if (previewEntity) mapView.map.removeLayer(previewEntity);
		if (previewCircle) mapView.map.removeLayer(previewCircle);
		if (previewLinePoints) mapView.map.removeLayer(previewLinePoints);
	}

	function addGeoOverlay(geoOverlay: GeoOverlay) {
		console.log('here');

		if (!geoOverlay) return;

		// Clear preview before adding final geoOverlay
		clearPreview();

		if (geoOverlay.type === 'LineString') {
			const coordinates = geoOverlay.geometry.coordinates as number[][];
			drawPolyline(
				coordinates.map(([lon, lat, alt]) => ({
					lat,
					lon,
					alt,
				})),
				geoOverlay.geometry.properties.borderColor
			).addTo(mapView.map);
			console.log('Added!');
		}
	}

	function removeGeoOverlay(geoOverlay: GeoOverlay) {}

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
		drawPoint,
		drawCircle,
		drawPolyline,
		drawPolygon,
		drawMissionPath,
		clearMissionPath,
		handleCirclePreviewClick,
		updateCirclePreview,
		endCirclePreview,
		drawCircleGeoOverlay,
		updatePolylinePreview,
		addPolygonPointPreview,
		clearPreview,
		addGeoOverlay,
		removeGeoOverlay,
	};
}
