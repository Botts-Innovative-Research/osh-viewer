import { useMapStore } from '@/stores/mapstore';
import { ref } from 'vue';
import * as Cesium from 'cesium';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { MapClickHandler } from './composables/useMap';

export type LayerType = 'WMS' | 'WMTS' | 'XYZ' | 'GEOJSON' | 'KML' | 'CZML' | 'GLTF';
export interface MapLayer {
	id: string;
	url: string;
	type: LayerType;
	parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}

const renderedLayers: Map<string, any> = new Map();

export async function createCesiumMap(container: string) {
	const map = new CesiumView({
		container,
		autoZoomOnFirstMarker: true,
		layers: [],
	});
	// Wait for Cesium to be fully ready
	await new Promise(requestAnimationFrame);
	return map;
}

export async function handleCesiumClick(map: any, onClick: MapClickHandler) {
	const viewer = map.viewer;
	// Description box styling
	viewer.infoBox.frame.onload = function () {
		const doc = viewer.infoBox.frame.contentDocument;
		doc.body.style.backgroundColor = '#242424';
		doc.body.style.color = '#ffffff';
	};

	let lat = 0,
		lon = 0;
	const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
	handler.setInputAction((click: any) => {
		const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
		if (!cartesian) return;

		const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
		lat = Cesium.Math.toDegrees(cartographic.latitude);
		lon = Cesium.Math.toDegrees(cartographic.longitude);
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	onClick(lat, lon, 120);
}

async function fetchLayerFromUrl(url: string) {
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch (error) {
		throw new Error(`Invalid URL`);
		return;
	}

	const type = detectLayerType(parsedUrl, url);
	if (!type) {
		throw new Error(`Could not detect layer type from URL: ${url}`);
	}

	const parsedParams = extractParams(parsedUrl, type);
	cesiumMapLayers.value.push({
		id: randomUUID(),
		url,
		type,
		parsedParams,
	});
}

function detectLayerType(parsed: URL, url: string): LayerType | null {
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
function extractParams(parsed: URL, type: LayerType) {
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

function removeLayer(id: string) {
	cesiumMapLayers.value = cesiumMapLayers.value.filter((layer: any) => layer.id !== id);
}
function set3DTerrain(value: boolean | null) {
	if (value === null) return;
	cesiumSettings.value.enable3DTerrain = value;
}
function set3DBuildings(value: boolean | null) {
	if (value === null) return;
	cesiumSettings.value.enable3DBuildings = value;
}
