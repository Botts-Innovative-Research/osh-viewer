import { MapLayer } from './cesium.adapter';
import { CursorMode, MapPoint, MapPointHandler } from '@/modules/map/types';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';

export interface MapAdapter {
	init(container: string): Promise<void>;
	destroy(): void;

	addLayer(layer: any): void;
	removeLayer(layer: any): Promise<void>;

	onClick(handler: MapPointHandler): () => void;
	onMouseMove(handler: MapPointHandler): () => void;
	setCursor(mode: CursorMode): void;
	flyToPoint(location: { x: number; y: number; z: number }): void;

	updateMarker(props: any): void;

	/* Map Drawing */
	addMarker(marker: any): void;
	removeMarker(marker: any): void;
	drawPoint(point: MapPoint, icon?: string, iconColor?: string, label?: string, id?: string): any;
	drawCircle(
		center: MapPoint,
		radius: number,
		borderColor?: string,
		fillColor?: string,
		name?: string,
		id?: string
	): any;
	drawPolyline(points: MapPoint[], borderColor?: string, name?: string, id?: string): any;
	drawPolygon(
		points: MapPoint[],
		borderColor?: string,
		fillColor?: string,
		name?: string,
		id?: string
	): any;

	/* Mission Builder */
	drawMissionWaypoints(waypoints: MapPoint[]): void;
	clearMissionWaypoints(): void;
	drawMissionPath(waypoints: MapPoint[], systemId: string): void;
	clearMissionPath(): void;

	/* GeoOverlay */
	updatePointPreview(
		point: MapPoint,
		icon?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	): void;
	updateCirclePreview(
		center: MapPoint,
		radius: number,
		borderColor?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	): void;
	updatePolylinePreview(
		points: MapPoint[],
		borderColor?: string | null,
		name?: string | null,
		id?: string
	): void;
	updatePolygonPreview(
		points: MapPoint[],
		borderColor?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	): void;
	clearPreview(): void;
	addGeoOverlay(geoOverlay: GeoOverlay): void;
	removeGeoOverlay(geoOverlay: GeoOverlay): void;

	/* CESIUM ONLY */
	addTerrain?(): void;
	removeTerrain?(): void;
	addBuildings?(): void;
	removeBuildings?(): void;
	addGooglePhotorealistic?(): void;
	removeGooglePhotorealistic?(): void;
	addMapLayer?(layer: MapLayer): void;
	removeMapLayer?(id: string): void;
	destroyAllLayers?(): void;
	rebuildMapLayers?(layers: MapLayer[]): void;
}
