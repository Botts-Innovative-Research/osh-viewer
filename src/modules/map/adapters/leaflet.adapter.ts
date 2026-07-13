import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter } from './types';
import { MapPoint, MapPointHandler } from '@/modules/map/types';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';

export function createLeafletAdapter(): MapAdapter {
	let mapView: typeof LeafletView | null;
	let flightPathPolyline: any = null;

	/* GeoOverlays */
	let previewEntity: any = null;
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
	function drawCircle(
		center: MapPoint,
		radius: number,
		borderColor: string | null,
		fillColor: string | null
	): L.circle {
		return L.circle([center.lat, center.lon], {
			radius,
			color: borderColor ?? '#FF0000',
			weight: 2,
			fillColor: fillColor ?? '#FF000080',
			fillOpacity: 1,
		});
	}
	function drawPolyline(points: MapPoint[], borderColor: string | null): L.polyline {
		return L.polyline(
			points.map((p) => [p.lat, p.lon]),
			{ color: borderColor ?? '#FF0000', weight: 5 }
		);
	}
	function drawPolygon(
		points: MapPoint[],
		borderColor: string | null,
		fillColor: string | null
	): L.polygon {
		return L.polygon(
			points.map((p) => [p.lat, p.lon]),
			{
				color: borderColor ?? '#FF0000',
				fillColor: fillColor ?? '#FF000080',
				fillOpacity: 1,
				weight: 5,
			}
		);
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
	function updateCirclePreview(
		center: MapPoint,
		radius: number,
		borderColor: string | null,
		fillColor: string | null
	): L.circle {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawCircle(center, radius, borderColor, fillColor);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	function updatePolylinePreview(points: MapPoint[], borderColor: string | null) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawPolyline(points, borderColor);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	function updatePolygonPreview(
		points: MapPoint[],
		borderColor: string | null,
		fillColor: string | null
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawPolygon(points, borderColor, fillColor);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	function clearPreview() {
		if (previewEntity) mapView.map.removeLayer(previewEntity);
	}

	function addGeoOverlay(geoOverlay: GeoOverlay) {
		if (!geoOverlay) return;

		// Clear preview before adding final geoOverlay
		clearPreview();

		// Circle
		if (geoOverlay.type === 'Circle') {
			const [lon, lat, alt] = geoOverlay.geometry.coordinates as [number, number, number];
			const center: MapPoint = {
				lat,
				lon,
				alt,
			};
			drawCircle(
				center,
				geoOverlay.geometry.properties.radius,
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.geometry.properties.fillColor
			).addTo(mapView.map);
		}
		// Polyline
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
		}
		// Polygon
		if (geoOverlay.type === 'Polygon') {
			const coordinates = geoOverlay.geometry.coordinates as number[][];
			drawPolygon(
				coordinates.map(([lon, lat, alt]) => ({
					lat,
					lon,
					alt,
				})),
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.geometry.properties.fillColor
			).addTo(mapView.map);
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
		updateCirclePreview,
		updatePolylinePreview,
		updatePolygonPreview,
		clearPreview,
		addGeoOverlay,
		removeGeoOverlay,
	};
}
