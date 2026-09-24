export interface CesiumIonUser {
	id: number;
	username: string;
	email: string;
	avatar: string | null;
}

export interface CesiumIonAssetsResponse {
	items: CesiumIonAsset[];
}

export interface CesiumIonAsset {
	id: number;
	type: string;
	name: string;
	description: string;
	attribution: string;
	bytes: number;
	dateAdded: string;
	status: string;
	percentComplete: number;
	labels: string[];
	creatorId?: number;
	creatorUsername?: string;
}

export type LayerType = 'WMS' | 'WMTS' | 'XYZ' | 'GEOJSON' | 'KML' | 'CZML' | 'GLTF';

export interface MapLayer {
	id: string;
	url: string;
	type: LayerType;
	parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}