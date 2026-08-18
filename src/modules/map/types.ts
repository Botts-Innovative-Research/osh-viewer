export type MapPointHandler = (lat: number, lon: number, alt: number) => void;
export type CursorMode = 'default' | 'crosshair';
export type MapPoint = {
	lat: number;
	lon: number;
	alt: number;
};
export interface OfflineMapLayer {
	id: string; // Unique ID
	fileServerUrl: string; // Must be set to the URL of the file server's node hosting the offline maps
	mapName: string; // Name of the map
	mapPath: string; // Path to the map file on the file server ex: /maps/<area>
	minZoom: number; // Minimum zoom level for the map ex: 12
	maxZoom: number; // Maximum zoom level for the map ex: 18
	lat: number; // Latitude of the map center
	lon: number; // Longitude of the map center
	hasBuildings: boolean; // Whether the map has buildings GeoJSON
}
