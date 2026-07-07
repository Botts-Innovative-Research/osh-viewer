import * as Cesium from 'cesium';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { MapAdapter } from './types';
import { Ion } from 'cesium';
import { CursorMode, MapPoint, MapPointHandler } from '@/modules/map/types';

// Showcase examples token :P
// Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODY0NTkzNS02NzI0LTQwNDktODk4Zi0zZDJjOWI2NTdmYTMiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI1ODJ9.IbAajOLYnsoyKy1BOd7fY1p6GH-wwNVMdMduA2IzGjA';
// Personal token
Ion.defaultAccessToken =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNDIyMzU2OC0wMWI4LTRjNGYtYTdiMy1kYjRmYzAwNGJkYTgiLCJpZCI6MzM1ODkzLCJpYXQiOjE3NTYzMDQ3MjZ9.5-F-lSal7TV6bHASnlpo5JCxamD0ppGPtQT7GUK5Ne4';

export type LayerType = 'WMS' | 'WMTS' | 'XYZ' | 'GEOJSON' | 'KML' | 'CZML' | 'GLTF';
export interface MapLayer {
	id: string;
	url: string;
	type: LayerType;
	parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}

export function createCesiumAdapter(): MapAdapter {
	let mapView: typeof CesiumView | null;
	let clickHandler: Cesium.ScreenSpaceEventHandler | null = null;
	let moveHandler: Cesium.ScreenSpaceEventHandler | null = null;
	let renderedLayers: Map<string, any> = new Map();
	let terrainProvider: any = null;
	let buildingsTileset: any = null;
	let googlePhotorealistic: any = null;
	let flightPathPolyline: any = null;

	/* Geofence previews */
	let previewCircle: any = null;
	let previewCenter: MapPoint | null = null;
	let previewCenterCartesian: Cesium.Cartesian3 | null = null;
	/* Geofence entities */
	let geofenceEntities: any[] = [];

	async function init(container: string) {
		mapView = new CesiumView({
			container,
			autoZoomOnFirstMarker: true,
			layers: [],
			geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
		});
		// Wait for Cesium to be fully ready
		await new Promise(requestAnimationFrame);
	}

	function invalidate() {
		mapView.viewer.scene.requestRender?.();
	}

	function destroy() {
		if (mapView.viewer && buildingsTileset) {
			mapView.viewer.scene.primitives.remove(buildingsTileset);
		}
		if (renderedLayers) destroyAllLayers();

		mapView?.destroy();
		clickHandler?.destroy();
		clickHandler = null;
		mapView = null;
		buildingsTileset = null;
		terrainProvider = null;
	}

	function addLayer(layer: any) {
		mapView.addLayer(layer);
	}

	async function removeLayer(layer: any): Promise<void> {
		mapView.removeAllFromLayer(layer);
		invalidate();
		await mapView.viewer.scene.postRender;
		return;
	}

	function setCursor(mode: CursorMode) {
		mapView.viewer.canvas.style.cursor = mode;
	}

	function onClick(handler: MapPointHandler) {
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
		};
	}

	function onMouseMove(handler: MapPointHandler) {
		const viewer = mapView.viewer;

		let lat = 0,
			lon = 0,
			alt = 0;

		moveHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
		moveHandler.setInputAction((movement: any) => {
			const cartesian = viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
			lat = Cesium.Math.toDegrees(cartographic.latitude);
			lon = Cesium.Math.toDegrees(cartographic.longitude);
			alt = cartographic.height;
			handler(lat, lon, alt ?? 120);
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

		return () => {
			moveHandler?.destroy();
			moveHandler = null;
		};
	}

	function flyToPoint(location: { x: number; y: number; z: number }) {
		mapView.viewer.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(
				location.x,
				location.y - 0.001,
				location.z + 100
			),
			// Offset to see the marker itself
			orientation: {
				pitch: Cesium.Math.toRadians(-35),
			},
		});
	}

	function updateMarker(props: any) {
		mapView.updateMarker(props);
	}

	function drawMissionPath(waypoints: MapPoint[]) {
		clearMissionPath();
		const positions = waypoints.map((wp: MapPoint) => {
			return Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt || 0);
		});
		flightPathPolyline = mapView.viewer.entities.add({
			polyline: {
				positions: positions,
				width: 5,
				material: new Cesium.PolylineOutlineMaterialProperty({
					color: Cesium.Color.RED,
					outlineWidth: 2,
					outlineColor: Cesium.Color.BLACK,
				}),
				clampToGround: true,
			},
		});
	}
	function clearMissionPath() {
		if (!mapView) return;
		mapView.viewer.entities.remove(flightPathPolyline);
		flightPathPolyline = null;
	}

	async function addTerrain() {
		// Assign terrain provider to map
		if (!terrainProvider) {
			terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1);
		}
		mapView.viewer.terrainProvider = terrainProvider;
	}

	function removeTerrain() {
		mapView.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
	}

	async function addBuildings() {
		const viewer = mapView.viewer;
		if (!viewer) return;

		if (buildingsTileset) {
			if (!viewer.scene.primitives.contains(buildingsTileset)) {
				viewer.scene.primitives.add(buildingsTileset);
			}
		} else {
			buildingsTileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
			viewer.scene.primitives.add(buildingsTileset);
		}
	}

	function removeBuildings() {
		if (buildingsTileset && mapView.viewer) {
			mapView.viewer.scene.primitives.remove(buildingsTileset);
			buildingsTileset = null;
		}
	}

	async function addGooglePhotorealistic() {
		const viewer = mapView.viewer;
		if (!viewer) return;

		if (googlePhotorealistic) {
			if (!viewer.scene.primitives.contains(googlePhotorealistic)) {
				viewer.scene.primitives.add(googlePhotorealistic);
			}
		} else {
			googlePhotorealistic = await Cesium.createGooglePhotorealistic3DTileset();
			viewer.scene.primitives.add(googlePhotorealistic);
		}
	}

	function removeGooglePhotorealistic() {
		if (googlePhotorealistic && mapView.viewer) {
			mapView.viewer.scene.primitives.remove(googlePhotorealistic);
			googlePhotorealistic = null;
		}
	}

	function addMapLayer(layer: MapLayer) {
		const viewer = mapView.viewer;
		if (!viewer) return;
		let ref: any;

		switch (layer.type) {
			case 'WMS': {
				const provider = new Cesium.WebMapServiceImageryProvider({
					url: layer.url.split('?')[0], // ← base URL only, no query params
					layers: layer.parsedParams?.layers,
					parameters: { transparent: true, format: 'image/png' },
				});
				ref = viewer.imageryLayers.addImageryProvider(provider);
				break;
			}
			case 'WMTS': {
				const provider = new Cesium.WebMapTileServiceImageryProvider({
					url: layer.url,
					layer: layer.parsedParams?.layer,
					style: layer.parsedParams?.style,
					tileMatrixSetID: layer.parsedParams?.tileMatrixSetID,
					format: layer.parsedParams?.format,
				});
				ref = viewer.imageryLayers.addImageryProvider(provider);
				break;
			}
			case 'XYZ': {
				const provider = new Cesium.UrlTemplateImageryProvider({
					url: layer.url,
				});
				ref = viewer.imageryLayers.addImageryProvider(provider);
				break;
			}
			case 'GEOJSON': {
				ref = viewer.dataSources.add(Cesium.GeoJsonDataSource.load(layer.url));
				break;
			}
			case 'KML': {
				ref = viewer.dataSources.add(Cesium.KmlDataSource.load(layer.url));
				break;
			}
			case 'CZML': {
				ref = viewer.dataSources.add(Cesium.CzmlDataSource.load(layer.url));
				break;
			}
			case 'GLTF': {
				ref = viewer.entities.add({ model: { uri: layer.url, scale: 1.0 } });
				break;
			}
			default:
				console.warn(`[Ion] Unsupported layer type: ${layer.type}`);
		}

		renderedLayers.set(layer.id, ref);
		invalidate();
	}

	function removeMapLayer(id: string) {
		const viewer = mapView.viewer;
		const ref = renderedLayers.get(id);
		if (!viewer || !ref) return;

		if (ref instanceof Cesium.ImageryLayer) {
			viewer.imageryLayers.remove(ref);
		} else if (ref instanceof Cesium.DataSource) {
			viewer.dataSources.remove(ref);
		} else if (ref instanceof Cesium.Entity) {
			viewer.entities.remove(ref);
		}

		renderedLayers.delete(id);
	}

	function destroyAllLayers() {
		const viewer = mapView.viewer;
		if (!viewer) return;

		for (const [id, ref] of renderedLayers) {
			try {
				removeMapLayer(id);
			} catch (e) {
				console.warn(`Failed removing layer ${id}`, e);
			}
		}

		renderedLayers.clear();
	}

	async function rebuildMapLayers(layers: MapLayer[]) {
		const viewer = mapView.viewer;
		if (!viewer) return;

		layers.forEach((layer: MapLayer) => {
			if (!renderedLayers.has(layer.id)) {
				addMapLayer(layer);
			}
		});

		invalidate();
	}

	/* Geofence Drawing Tools */
	function handleCirclePreviewClick(center: MapPoint) {
		// If preview circle already exists, this is second click -> confirm geo-overlay
		if (previewCircle) {
			endCirclePreview();
			return;
		}
		// Create new preview circle geo-overlay
		previewCenter = center; // Save center of circle
		previewCenterCartesian = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, center.alt);
		previewCircle = mapView.viewer.entities.add({
			position: previewCenterCartesian,
			name: 'Preview circle',
			ellipse: {
				semiMajorAxis: new Cesium.ConstantProperty(0),
				semiMinorAxis: new Cesium.ConstantProperty(0),
				height: center.alt,
				material: Cesium.Color.BLUE.withAlpha(0.3),
				outline: true, // height must be set for outline to display
			},
		});
	}

	function updateCirclePreview(mouse: MapPoint) {
		if (!previewCircle || !previewCenterCartesian) return;

		const mouseCartesian = Cesium.Cartesian3.fromDegrees(mouse.lon, mouse.lat, mouse.alt);
		const radius = Cesium.Cartesian3.distance(previewCenterCartesian, mouseCartesian);

		previewCircle.ellipse.semiMajorAxis!.setValue(radius);
		previewCircle.ellipse.semiMinorAxis!.setValue(radius);
	}

	function endCirclePreview() {
		if (!previewCircle || !previewCenter) return;

		// Add to geo-overlay list
		geofenceEntities.push(previewCircle);

		// Empty preview circle
		previewCircle = null;
		previewCenter = null;
		previewCenterCartesian = null;

		invalidate();

		// mapView.viewer.entities.remove(previewCircle);

		// Extract center
		// const centerCartesian = previewCircle.position?.getValue(Cesium.JulianDate.now());
		// if (!centerCartesian) return;
		// const cartographic = Cesium.Cartographic.fromCartesian(centerCartesian);
		// const center: MapPoint = {
		// 	lat: Cesium.Math.toDegrees(cartographic.latitude),
		// 	lon: Cesium.Math.toDegrees(cartographic.longitude),
		// 	alt: cartographic.height,
		// };
		// // Extract radius (axis)
		// const radius = previewCircle.ellipse?.semiMajorAxis?.getValue(Cesium.JulianDate.now());
		// if (radius == null) return;

		// drawCircleGeofence(center, radius);
		// previewCircle = null;
	}

	function drawCircleGeofence(center: MapPoint, radius: number) {
		const newCircle = mapView.viewer.entities.add({
			position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat),
			name: 'Preview circle',
			ellipse: {
				semiMinorAxis: radius,
				semiMajorAxis: radius,
				material: Cesium.Color.BLUE,
				height: center.alt,
				outline: true, // height must be set for outline to display
				classificationType: Cesium.ClassificationType.TERRAIN,
			},
		});
		geofenceEntities.push(newCircle);
		invalidate();
	}

	return {
		init,
		destroy,
		addLayer,
		removeLayer,
		setCursor,
		onClick,
		onMouseMove,
		flyToPoint,
		updateMarker,
		drawMissionPath,
		clearMissionPath,
		addTerrain,
		removeTerrain,
		addBuildings,
		removeBuildings,
		addGooglePhotorealistic,
		removeGooglePhotorealistic,
		addMapLayer,
		removeMapLayer,
		destroyAllLayers,
		rebuildMapLayers,
		handleCirclePreviewClick,
		updateCirclePreview,
		endCirclePreview,
		drawCircleGeofence,
	};
}
