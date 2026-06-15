import { MapLayer } from './cesium.adapter';

export type MapClickHandler = (lat: number, lon: number, alt: number) => void;
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
	addFOILayer(markerProps: any): void;
	removeLayer(layer: any): Promise<void>;

	onClick(handler: MapClickHandler): () => void;
	setCursor(mode: CursorMode): void;
	flyToPoint(location: { x: number; y: number; z: number }): void;

	updateMarker(props: any): void;

	/* Mission Builder */
	drawMissionPath(waypoints: MapPoint[]): void;
	clearMissionPath(): void;

	/* CESIUM ONLY */
	addTerrain?(): void;
	removeTerrain?(): void;
	addBuildings?(): void;
	removeBuildings?(): void;
	addMapLayer?(layer: MapLayer): void;
	removeMapLayer?(id: string): void;
	destroyAllLayers?(): void;
	rebuildMapLayers?(layers: MapLayer[]): void;
}
