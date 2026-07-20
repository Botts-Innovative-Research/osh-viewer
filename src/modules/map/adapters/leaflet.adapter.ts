import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter } from './types';
import { MapPoint, MapPointHandler } from '@/modules/map/types';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { getColoredIconUrl } from '@/modules/map/services/colorId.service';
import { ICON_BASE } from '@/lib/icons';

export function createLeafletAdapter(): MapAdapter {
	let mapView: typeof LeafletView | null;
	let flightPathPolylines: any[] = [];
	let waypointMarkers: any[] = [];

	/* GeoOverlays */
	let previewEntity: any = null;

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

	function addMarker(marker: any) {
		marker.addTo(mapView.map);
	}

	function removeMarker(marker: any) {
		mapView.map.removeLayer(marker);
	}

	async function drawPoint(
		point: MapPoint,
		icon?: string,
		iconColor?: string,
		label?: string,
		id?: string
	) {
		const coloredIcon =
			iconColor && icon ? await getColoredIconUrl(`${ICON_BASE}${icon}`, iconColor) : icon;
		const iconOptions: any = {
			iconUrl: coloredIcon ?? '/icons/map/map-marker.png',
			iconSize: [32, 32],
		};
		const marker = L.marker([point.lat, point.lon], {
			icon: L.icon(iconOptions),
		});
		if (label) {
			marker.bindTooltip(label);
		}
		return marker;
	}
	function drawCircle(
		center: MapPoint,
		radius: number,
		borderColor: string | null,
		fillColor: string | null,
		id?: string
	): L.circle {
		return L.circle([center.lat, center.lon], {
			id: id,
			radius,
			color: borderColor ?? '#FF0000',
			weight: 2,
			fillColor: fillColor ?? '#FF000080',
			fillOpacity: 1,
		});
	}
	function drawPolyline(points: MapPoint[], borderColor: string | null, id?: string): L.polyline {
		return L.polyline(
			points.map((p) => [p.lat, p.lon]),
			{ id: id, color: borderColor ?? '#FF0000', weight: 5 }
		);
	}
	function drawPolygon(
		points: MapPoint[],
		borderColor: string | null,
		fillColor: string | null,
		id?: string
	): L.polygon {
		return L.polygon(
			points.map((p) => [p.lat, p.lon]),
			{
				id: id,
				color: borderColor ?? '#FF0000',
				fillColor: fillColor ?? '#FF000080',
				fillOpacity: 1,
				weight: 5,
			}
		);
	}

	function drawMissionPath(waypoints: MapPoint[]) {
		const polyline = drawPolyline(waypoints, '#5d6cce');
		polyline.addTo(mapView.map);
		flightPathPolylines.push(polyline);
	}

	function clearMissionPath() {
		for (const polyline of flightPathPolylines) {
			mapView.map.removeLayer(polyline);
		}
		flightPathPolylines = [];
	}

	async function drawMissionWaypoints(waypoints: MapPoint[]) {
		clearMissionWaypoints();
		for (let index = 0; index < waypoints.length; index++) {
			const marker = await drawPoint(
				waypoints[index],
				'/icons/waypoint/round-pin.png',
				'#5d6cce',
				`WP ${index + 1}`
			);
			marker.addTo(mapView.map);
			waypointMarkers.push(marker);
		}
	}

	function clearMissionWaypoints() {
		for (const marker of waypointMarkers) {
			mapView.map.removeLayer(marker);
		}
		waypointMarkers = [];
	}

	/* Geofence Drawing Tools */
	function updateCirclePreview(
		center: MapPoint,
		radius: number,
		borderColor: string | null,
		fillColor: string | null
	) {
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
		previewEntity = null;
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
			const newCircle = drawCircle(
				center,
				geoOverlay.geometry.properties.radius,
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.geometry.properties.fillColor,
				geoOverlay.uuid
			);
			newCircle.addTo(mapView.map);
		}
		// Polyline
		if (geoOverlay.type === 'LineString') {
			const coordinates = geoOverlay.geometry.coordinates as number[][];
			const newPolyline = drawPolyline(
				coordinates.map(([lon, lat, alt]) => ({
					lat,
					lon,
					alt,
				})),
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.uuid
			);
			newPolyline.addTo(mapView.map);
		}
		// Polygon
		if (geoOverlay.type === 'Polygon') {
			const coordinates = geoOverlay.geometry.coordinates as number[][];
			const newPolygon = drawPolygon(
				coordinates.map(([lon, lat, alt]) => ({
					lat,
					lon,
					alt,
				})),
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.geometry.properties.fillColor,
				geoOverlay.uuid
			);
			newPolygon.addTo(mapView.map);
		}
	}

	function removeGeoOverlay(geoOverlay: GeoOverlay) {
		let findGeoOverlay = null;
		mapView.map.eachLayer(function (layer: any) {
			if (layer.options && layer.options.id === geoOverlay.uuid) {
				findGeoOverlay = layer;
			}
		});
		if (findGeoOverlay) mapView.map.removeLayer(findGeoOverlay);
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
		addMarker,
		removeMarker,
		drawPoint,
		drawCircle,
		drawPolyline,
		drawPolygon,
		drawMissionWaypoints,
		clearMissionWaypoints,
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
