import { MapLayer } from './cesium.adapter';

export type MapClickHandler = (lat: number, lon: number, alt: number) => void;
export type CursorMode = 'default' | 'crosshair';
export const layerTypes = [
  'layerIdToPolylines',
  //these are not implemented yet, so u can comment them out tbh but i wouldnt remove them
  // 'layerIdToEllipsoids',
  // 'layerIdToPolygon',
  // 'layerIdToFrustum',
  // 'layerIdToDrapedImage'
]

export interface MapAdapter {
	init(container: string): Promise<void>;
	destroy(): void;

	addLayer(layer: any): void;
	removeLayer(layer: any): void;
  toggleLayerVisibility(id: string, isVisible: boolean): void;

	onClick(handler: MapClickHandler): () => void;
	setCursor(mode: CursorMode): void;
	flyToPoint(location: { x: number; y: number, z: number }): void;

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
