export const CESIUM_API_URL = 'https://api.cesium.com/v1';

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

export interface CesiumUploadConfig {
	name: string;
	description?: string;
	type: '3DTILES' | 'IMAGERY' | 'TERRAIN';
	options: {
		sourceType: string;
		[key: string]: unknown;
	};
}

// Reserved asset IDs - prevent manually importing these assets
const id3DTerrain = 1;
const idGooglePhotorealistic = 2275207;
const id3DBuildings = 96188;
export const RESERVED_ASSET_IDS = [id3DTerrain, idGooglePhotorealistic, id3DBuildings];

export type LayerType = 'WMS' | 'WMTS' | 'XYZ' | 'GEOJSON' | 'KML' | 'CZML' | 'GLTF';

export interface MapLayer {
	id: string;
	url: string;
	type: LayerType;
	parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}
