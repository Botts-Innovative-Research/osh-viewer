import { MapLayer } from './cesium.adapter';
import { CursorMode, MapPoint, MapPointHandler } from '@/modules/map/types';

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

	/* Mission Builder */
	drawMissionPath(waypoints: MapPoint[]): void;
	clearMissionPath(): void;

	/* GeoOverlay */
	// Circle
	handleCirclePreviewClick(center: MapPoint): void; // Handles center click and radius confirmation click
	updateCirclePreview(mouse: MapPoint): void; // Handles radius preview
	endCirclePreview(): void;
	drawCircleGeoOverlay(center: MapPoint, radius: number): void;
	// Polyline
	addPolylinePointPreview(point: MapPoint): void;
	// drawPolylineGeoOverlay(): void;
	// Polygon
	addPolygonPointPreview(point: MapPoint): void;
	// drawPolygonGeoOverlay(): void;
	// Cleanup
	clearPreviews(): void;

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
