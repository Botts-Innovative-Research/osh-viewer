import { LayerType } from '../adapters/cesium.adapter';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';

export async function fetchLayerFromUrl(url: string) {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch (error) {
		throw new Error(`Invalid URL`);
	}

	const type = detectLayerType(parsedUrl, url);
	if (!type) {
		throw new Error(`Could not detect layer type from URL: ${url}`);
	}

	const parsedParams = extractParams(parsedUrl, type);
	return {
		id: randomUUID(),
		url,
		type,
		parsedParams,
	};
}

export function detectLayerType(parsed: URL, url: string): LayerType | null {
	const service = parsed.searchParams.get('SERVICE')?.toUpperCase();

	if (service === 'WMS') return 'WMS';
	else if (service === 'WMTS') return 'WMTS';
	else if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}')) return 'XYZ';
	else if (url.endsWith('.json') || url.endsWith('.geojson')) return 'GEOJSON';
	else if (url.endsWith('.kml')) return 'KML';
	else if (url.endsWith('.czml')) return 'CZML';
	else if (url.endsWith('.gltf') || url.endsWith('.glb')) return 'GLTF';
	else return null; // Unknown layer type
}

export function extractParams(parsed: URL, type: LayerType) {
	switch (type) {
		case 'WMS':
			return {
				layers:
					parsed.searchParams.get('LAYERS') ?? parsed.searchParams.get('layers') ?? '',
			};
		case 'WMTS':
			return {
				layer: parsed.searchParams.get('LAYER') ?? parsed.searchParams.get('layer') ?? '',
				style:
					parsed.searchParams.get('STYLE') ??
					parsed.searchParams.get('style') ??
					'default',
				tileMatrixSetID:
					parsed.searchParams.get('TILEMATRIXSET') ??
					parsed.searchParams.get('tilematrixset') ??
					'',
				format:
					parsed.searchParams.get('FORMAT') ??
					parsed.searchParams.get('format') ??
					'image/png',
			};
		default:
			return {};
	}
}
