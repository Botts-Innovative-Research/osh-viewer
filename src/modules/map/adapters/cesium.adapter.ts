import * as Cesium from 'cesium';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { MapAdapter, MapClickHandler } from './types';
import { Ion } from 'cesium';

Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNDIyMzU2OC0wMWI4LTRjNGYtYTdiMy1kYjRmYzAwNGJkYTgiLCJpZCI6MzM1ODkzLCJpYXQiOjE3NTYzMDQ3MjZ9.5-F-lSal7TV6bHASnlpo5JCxamD0ppGPtQT7GUK5Ne4';

export type LayerType = 'WMS' | 'WMTS' | 'XYZ' | 'GEOJSON' | 'KML' | 'CZML' | 'GLTF';
export interface MapLayer {
	id: string;
	url: string;
	type: LayerType;
	parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}

const renderedLayers: Map<string, any> = new Map();

export function createCesiumAdapter(): MapAdapter {
	let mapView: any;
	let clickHandler: Cesium.ScreenSpaceEventHandler | null = null;

	return {
		async init(container) {
			mapView = new CesiumView({
				container,
				autoZoomOnFirstMarker: true,
				layers: [],
			});
			// Wait for Cesium to be fully ready
			await new Promise(requestAnimationFrame);
		},

		destroy() {
			clickHandler?.destroy();
			clickHandler = null;
			mapView?.destroy();
			mapView = null;
		},

		addLayer(layer) {
			mapView.addLayer(layer);
		},

		removeLayer(layer) {
			mapView.removeAllFromLayer(layer);
		},

		setCursor(mode) {
			mapView.viewer.canvas.style.cursor = mode;
		},

		onClick(handler: MapClickHandler) {
			const viewer = mapView.viewer;
			// Description box styling
			viewer.infoBox.frame.onload = function () {
				const doc = viewer.infoBox.frame.contentDocument;
				doc.body.style.backgroundColor = '#242424';
				doc.body.style.color = '#ffffff';
			};

			let lat = 0,
				lon = 0,
				alt = 0;

			clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
			clickHandler.setInputAction((click: any) => {
				// Updated to pickPosition to handle 3D terrain/tiles
				const cartesian = viewer.scene.pickPosition(click.position);
				if (!cartesian) return;
				const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
				lat = Cesium.Math.toDegrees(cartographic.latitude);
				lon = Cesium.Math.toDegrees(cartographic.longitude);
				alt = cartographic.height;
				handler(lat, lon, alt ?? 120);
			}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

			return () => {
				clickHandler?.destroy();
				clickHandler = null;
			}
		},
	}
}


// async function fetchLayerFromUrl(url: string) {
// 	let parsedUrl: URL;
// 	try {
// 		parsedUrl = new URL(url);
// 	} catch (error) {
// 		throw new Error(`Invalid URL`);
// 		return;
// 	}

// 	const type = detectLayerType(parsedUrl, url);
// 	if (!type) {
// 		throw new Error(`Could not detect layer type from URL: ${url}`);
// 	}

// 	const parsedParams = extractParams(parsedUrl, type);
// 	cesiumMapLayers.value.push({
// 		id: randomUUID(),
// 		url,
// 		type,
// 		parsedParams,
// 	});
// }

// function detectLayerType(parsed: URL, url: string): LayerType | null {
// 	const service = parsed.searchParams.get('SERVICE')?.toUpperCase();

// 	if (service === 'WMS') return 'WMS';
// 	else if (service === 'WMTS') return 'WMTS';
// 	else if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}')) return 'XYZ';
// 	else if (url.endsWith('.json') || url.endsWith('.geojson')) return 'GEOJSON';
// 	else if (url.endsWith('.kml')) return 'KML';
// 	else if (url.endsWith('.czml')) return 'CZML';
// 	else if (url.endsWith('.gltf') || url.endsWith('.glb')) return 'GLTF';
// 	else return null; // Unknown layer type
// }
// function extractParams(parsed: URL, type: LayerType) {
// 	switch (type) {
// 		case 'WMS':
// 			return {
// 				layers:
// 					parsed.searchParams.get('LAYERS') ?? parsed.searchParams.get('layers') ?? '',
// 			};
// 		case 'WMTS':
// 			return {
// 				layer: parsed.searchParams.get('LAYER') ?? parsed.searchParams.get('layer') ?? '',
// 				style:
// 					parsed.searchParams.get('STYLE') ??
// 					parsed.searchParams.get('style') ??
// 					'default',
// 				tileMatrixSetID:
// 					parsed.searchParams.get('TILEMATRIXSET') ??
// 					parsed.searchParams.get('tilematrixset') ??
// 					'',
// 				format:
// 					parsed.searchParams.get('FORMAT') ??
// 					parsed.searchParams.get('format') ??
// 					'image/png',
// 			};
// 		default:
// 			return {};
// 	}
// }

// function removeLayer(id: string) {
// 	cesiumMapLayers.value = cesiumMapLayers.value.filter((layer: any) => layer.id !== id);
// }
// function set3DTerrain(value: boolean | null) {
// 	if (value === null) return;
// 	cesiumSettings.value.enable3DTerrain = value;
// }
// function set3DBuildings(value: boolean | null) {
// 	if (value === null) return;
// 	cesiumSettings.value.enable3DBuildings = value;
// }
