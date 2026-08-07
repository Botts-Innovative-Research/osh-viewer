import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import L from 'leaflet';
import { MapAdapter } from './types';
import { MapPoint, MapPointHandler } from '@/modules/map/types';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { colorHash, getColoredIconUrl } from '@/modules/map/services/colorId.service';
import { ICON_BASE } from '@/lib/icons';

export function createLeafletAdapter(): MapAdapter {
	let mapView: typeof LeafletView | null;
	let flightPathPolylines: any[] = [];
	let waypointMarkers: any[] = [];

	/* GeoOverlays */
	let previewEntity: any = null;

	async function init(container: string) {
		// mapView = new LeafletView({
		// 	container,
		// 	layers: [],
		// 	autoZoomOnFirstMarker: true,
		// });
		//
		// const offlineLayer = L.tileLayer('http://localhost:8080/maps/alabama/{z}/{x}/{y}.png', {
		// 	minZoom: 8,
		// 	maxZoom: 12,
		// });
		//
		// offlineLayer.addTo(mapView.map);

		let offlineLayer;
		// TEST: ALABAMA
		// offlineLayer = L.tileLayer('http://localhost:8080/maps/alabama/{z}/{x}/{y}.png', {
		// 	minZoom: 8,
		// 	maxZoom: 12,
		// });
		// TEST: RC FIELD
		offlineLayer = L.tileLayer('http://localhost:8080/maps/rcfield/{z}/{x}/{y}.png', {
			minZoom: 12,
			maxZoom: 20,
		});

		mapView = new LeafletView({
			container,
			layers: [],
			autoZoomOnFirstMarker: true,

			baseLayers: offlineLayer
				? {
						'Alabama Offline': offlineLayer,
					}
				: undefined,

			defaultLayer: offlineLayer,

			// TEST: ALABAMA
			// initialView: {
			// 	lat: 32.8,
			// 	lon: -86.8,
			// 	zoom: 8,
			// },
			// TEST: RC FIELD
			initialView: {
				lat: 34.6856466,
				lon: -86.5968429,
				zoom: 12,
			},
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
	): Promise<L.Marker> {
		const coloredIcon =
			iconColor && icon ? await getColoredIconUrl(`${ICON_BASE}${icon}`, iconColor) : icon;
		const iconOptions: any = {
			iconUrl: coloredIcon ?? '/icons/map/map-marker.png',
			iconSize: [32, 32],
		};
		const marker = L.marker([point.lat, point.lon], {
			id: id,
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
		borderColor?: string,
		fillColor?: string,
		name?: string,
		id?: string
	): L.circle {
		const circle = L.circle([center.lat, center.lon], {
			id: id,
			radius,
			color: borderColor ?? '#FF0000',
			weight: 2,
			fillColor: fillColor ?? '#FF000080',
			fillOpacity: 1,
		});
		if (name) circle.bindTooltip(name);
		return circle;
	}
	function drawPolyline(
		points: MapPoint[],
		borderColor?: string,
		name?: string,
		id?: string
	): L.polyline {
		const polyline = L.polyline(
			points.map((p) => [p.lat, p.lon]),
			{ id: id, color: borderColor ?? '#FF0000', weight: 5 }
		);
		if (name) polyline.bindTooltip(name);
		return polyline;
	}
	function drawPolygon(
		points: MapPoint[],
		borderColor?: string,
		fillColor?: string,
		name?: string,
		id?: string
	): L.polygon {
		const polygon = L.polygon(
			points.map((p) => [p.lat, p.lon]),
			{
				id: id,
				color: borderColor ?? '#FF0000',
				fillColor: fillColor ?? '#FF000080',
				fillOpacity: 1,
				weight: 5,
			}
		);
		if (name) polygon.bindTooltip(name);
		return polygon;
	}

	function drawMissionPath(waypoints: MapPoint[], systemId: string) {
		const color = colorHash(systemId).hex;
		const polyline = drawPolyline(waypoints, color);
		polyline.addTo(mapView.map);
		flightPathPolylines.push(polyline);
	}

	function clearMissionPath() {
		for (const polyline of flightPathPolylines) {
			mapView.map.removeLayer(polyline);
		}
		flightPathPolylines = [];
	}

	async function drawMissionWaypoints(waypoints: MapPoint[], systemId: string) {
		const color = colorHash(systemId).hex;

		clearMissionWaypoints();
		for (let index = 0; index < waypoints.length; index++) {
			const marker = await drawPoint(
				waypoints[index],
				'/icons/waypoint/round-pin.png',
				color,
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
	async function updatePointPreview(
		point: MapPoint,
		icon?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = await drawPoint(
			point,
			icon ?? undefined,
			fillColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		previewEntity.addTo(mapView.map);
	}
	function updateCirclePreview(
		center: MapPoint,
		radius: number,
		borderColor?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawCircle(
			center,
			radius,
			borderColor ?? undefined,
			fillColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	async function updatePolylinePreview(
		points: MapPoint[],
		borderColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = await drawPolyline(
			points,
			borderColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	function updatePolygonPreview(
		points: MapPoint[],
		borderColor?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawPolygon(
			points,
			borderColor ?? undefined,
			fillColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		previewEntity.addTo(mapView.map);
	}

	function clearPreview() {
		if (previewEntity) mapView.map.removeLayer(previewEntity);
		previewEntity = null;
	}

	async function addGeoOverlay(geoOverlay: GeoOverlay) {
		if (!geoOverlay) return;

		// Clear preview before adding final geoOverlay
		clearPreview();

		// Point
		if (geoOverlay.type === 'Point') {
			const [lon, lat, alt] = geoOverlay.geometry.coordinates as [number, number, number];
			const point: MapPoint = {
				lat,
				lon,
				alt,
			};
			const newPoint = await drawPoint(
				point,
				geoOverlay.geometry.properties.icon,
				geoOverlay.geometry.properties.fillColor,
				geoOverlay.name,
				geoOverlay.uuid
			);
			newPoint.addTo(mapView.map);
		}
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
				geoOverlay.name,
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
				geoOverlay.name,
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
				geoOverlay.name,
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
		updatePointPreview,
		updateCirclePreview,
		updatePolylinePreview,
		updatePolygonPreview,
		clearPreview,
		addGeoOverlay,
		removeGeoOverlay,
	};
}
