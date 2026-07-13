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
	drawPoint(point: MapPoint): any;
	drawCircle(
		center: MapPoint,
		radius: number,
		borderColor: string | null,
		fillColor: string | null
	): any;
	drawPolyline(points: MapPoint[], borderColor: string | null): any;
	drawPolygon(points: MapPoint[], borderColor: string | null, fillColor: string | null): any;

	/* Mission Builder */
	drawMissionPath(waypoints: MapPoint[]): void;
	clearMissionPath(): void;

	/* GeoOverlay */
	updateCirclePreview(
		center: MapPoint,
		radius: number,
		borderColor: string | null,
		fillColor: string | null
	): void;
	updatePolylinePreview(points: MapPoint[], borderColor: string | null): void;
	updatePolygonPreview(
		points: MapPoint[],
		borderColor: string | null,
		fillColor: string | null
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
