import { MapLayer } from './cesium.adapter';

export type MapPointHandler = (lat: number, lon: number, alt: number) => void;
export type CursorMode = 'default' | 'crosshair';
export type MapPoint = {
	lat: number;
	lon: number;
	alt: number;
};

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

	/* Geofence */
	handleCirclePreviewClick(center: MapPoint): void;
	updateCirclePreview(mouse: MapPoint): void;
	endCirclePreview(): void;
	drawCircleGeofence(center: MapPoint, radius: number): void;

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
