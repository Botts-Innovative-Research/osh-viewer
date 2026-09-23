export interface CesiumIonUser {
	id: number;
	username: string;
	email: string;
	avatar: string | null;
}

export interface CesiumIonAsset {
	id: number;
	type: string;
}

export type LayerType = 'WMS' | 'WMTS' | 'XYZ' | 'GEOJSON' | 'KML' | 'CZML' | 'GLTF';

export interface MapLayer {
	id: string;
	url: string;
	type: LayerType;
	parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}