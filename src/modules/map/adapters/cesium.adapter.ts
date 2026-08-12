import * as Cesium from 'cesium';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import { MapAdapter } from './types';
import { Ion } from 'cesium';
import { CursorMode, MapPoint, MapPointHandler } from '@/modules/map/types';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { colorHash, getColoredIconUrl } from '@/modules/map/services/colorId.service';
import { ICON_BASE } from '@/lib/icons';
import { getCenterPoint } from '@/modules/map/services/geospatial.service';

// Showcase examples token :P
// Ion.defaultAccessToken =
// 	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODY0NTkzNS02NzI0LTQwNDktODk4Zi0zZDJjOWI2NTdmYTMiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI1ODJ9.IbAajOLYnsoyKy1BOd7fY1p6GH-wwNVMdMduA2IzGjA';
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
	let flightPathPolylines: any[] = [];
	let waypointEntities: any[] = [];

	/* GeoOverlays */
	let previewEntity: any = null;

	async function init(container: string) {
		mapView = new CesiumView({
			container,
			autoZoomOnFirstMarker: true,
			layers: [],
			geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
		});

		// OFFLINE MAP
		const offlineEnabled = import.meta.env.VITE_OFFLINE_MAP_ENABLED === 'true';

		if (offlineEnabled) {
			const offlineMapPath = import.meta.env.VITE_OFFLINE_MAP_PATH;
			const offlineMapMaxZoom = Number(import.meta.env.VITE_OFFLINE_MAP_MAX_ZOOM);
			const offlineMapLat = Number(import.meta.env.VITE_OFFLINE_MAP_LAT);
			const offlineMapLon = Number(import.meta.env.VITE_OFFLINE_MAP_LON);

			console.log('Offline map enabled');
			console.log('Offline map URL:', `${offlineMapPath}/{z}/{x}/{y}.png`);

			// Remove Cesium's default imagery
			mapView.viewer.imageryLayers.removeAll();

			// Create local XYZ imagery provider
			const offlineProvider = new Cesium.UrlTemplateImageryProvider({
				url: `${offlineMapPath}/{z}/{x}/{y}.png`,
				tilingScheme: new Cesium.WebMercatorTilingScheme(),
				maximumLevel: offlineMapMaxZoom,
				credit: 'Offline Map',
			});

			mapView.viewer.imageryLayers.addImageryProvider(offlineProvider);
			mapView.viewer.scene.globe.show = true;

			// Move camera over the offline map
			mapView.viewer.camera.flyTo({
				destination: Cesium.Cartesian3.fromDegrees(offlineMapLon, offlineMapLat, 3000),
				duration: 0,
			});
		}

		// CESIUM TERRAIN / DEPTH

		mapView.viewer.scene.globe.depthTestAgainstTerrain = false;
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

	function onRightClick(handler: MapPointHandler) {
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
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

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

	function addMarker(marker: any) {
		mapView.viewer.entities.add(marker);
		invalidate();
	}

	function removeMarker(marker: any) {
		mapView.viewer.entities.remove(marker);
		invalidate();
	}

	async function drawPoint(
		point: MapPoint,
		icon?: string,
		iconColor?: string,
		label?: string,
		id?: string
	) {
		const coloredIcon =
			iconColor && icon ? await getColoredIconUrl(`${ICON_BASE}${icon}`, iconColor) : icon;
		return new Cesium.Entity({
			id: id ?? randomUUID(),
			position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.alt || 0),
			billboard: {
				image: coloredIcon ?? '/icons/map/map-marker.png',
				width: 32,
				height: 32,
			},
			...(label
				? {
						label: {
							text: label,
							font: '10pt monospace',
							style: Cesium.LabelStyle.FILL_AND_OUTLINE,
							outlineWidth: 2,
							verticalOrigin: Cesium.VerticalOrigin.TOP,
							pixelOffset: new Cesium.Cartesian2(0, 32),
						},
					}
				: {}),
		});
	}
	function drawCircle(
		center: MapPoint,
		radius: number,
		borderColor?: string,
		fillColor?: string,
		name?: string,
		id?: string
	) {
		return new Cesium.Entity({
			id: id ?? randomUUID(),
			position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat),
			ellipse: {
				semiMajorAxis: new Cesium.ConstantProperty(radius),
				semiMinorAxis: new Cesium.ConstantProperty(radius),
				height: center.alt,
				heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				material: Cesium.Color.fromCssColorString(fillColor ?? '#FF000080'),
				outline: true, // height must be set for outline to display
				outlineColor: Cesium.Color.fromCssColorString(borderColor ?? '#FF0000'),
				outlineWidth: 3,
			},
			...(name
				? {
						label: {
							text: name,
							font: '14pt monospace',
							style: Cesium.LabelStyle.FILL_AND_OUTLINE,
							outlineWidth: 2,
							verticalOrigin: Cesium.VerticalOrigin.TOP,
							pixelOffset: new Cesium.Cartesian2(0, 32),
						},
					}
				: {}),
		});
	}
	function drawPolyline(points: MapPoint[], borderColor?: string, name?: string, id?: string) {
		return new Cesium.Entity({
			id: id ?? randomUUID(),
			position: getCenterPoint(points), // Used for center of label
			polyline: {
				positions: points.map(({ lat, lon, alt }) => {
					return Cesium.Cartesian3.fromDegrees(lon, lat);
				}),
				width: 3,
				material: new Cesium.PolylineOutlineMaterialProperty({
					outlineColor: Cesium.Color.fromCssColorString(borderColor ?? '#FF000080'),
					outlineWidth: 3,
				}),
				clampToGround: true,
			},
			...(name
				? {
						label: {
							text: name,
							font: '14pt monospace',
							style: Cesium.LabelStyle.FILL_AND_OUTLINE,
							outlineWidth: 2,
							verticalOrigin: Cesium.VerticalOrigin.TOP,
							pixelOffset: new Cesium.Cartesian2(0, 32),
						},
					}
				: {}),
		});
	}
	function drawPolygon(
		points: MapPoint[],
		borderColor?: string,
		fillColor?: string,
		name?: string,
		id?: string
	) {
		return new Cesium.Entity({
			id: id ?? randomUUID(),
			// position: getCenterPoint(points), // Used for center of label
			polygon: {
				hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights(
					points.flatMap(({ lat, lon, alt }) => {
						return [lon, lat, alt ?? 0];
					})
				),
				perPositionHeight: true,
				material: Cesium.Color.fromCssColorString(fillColor ?? '#FF000080'),
				outline: true,
				outlineColor: Cesium.Color.fromCssColorString(borderColor ?? '#FF0000'),
				outlineWidth: 3,
				classificationType: Cesium.ClassificationType.TERRAIN,
			},
			...(name
				? {
						label: {
							text: name,
							font: '14pt monospace',
							style: Cesium.LabelStyle.FILL_AND_OUTLINE,
							outlineWidth: 2,
							verticalOrigin: Cesium.VerticalOrigin.TOP,
							pixelOffset: new Cesium.Cartesian2(0, 32),
						},
					}
				: {}),
		});
	}

	function drawMissionPath(waypoints: MapPoint[], systemId: string) {
		const color = colorHash(systemId).hex;
		const entity = drawPolyline(waypoints, color);
		mapView.viewer.entities.add(entity);
		flightPathPolylines.push(entity);
	}

	function clearMissionPath() {
		if (!mapView) return;
		for (const entity of flightPathPolylines) {
			mapView.viewer.entities.remove(entity);
		}
		flightPathPolylines = [];
	}

	async function drawMissionWaypoints(waypoints: MapPoint[], systemId: string) {
		const color = colorHash(systemId).hex;
		clearMissionWaypoints();
		for (let index = 0; index < waypoints.length; index++) {
			const entity = await drawPoint(
				waypoints[index],
				'/icons/waypoint/round-pin.png',
				color,
				`WP ${index + 1}`
			);
			mapView.viewer.entities.add(entity);
			waypointEntities.push(entity);
		}
		invalidate();
	}

	function clearMissionWaypoints() {
		if (!mapView) return;
		for (const entity of waypointEntities) {
			mapView.viewer.entities.remove(entity);
		}
		waypointEntities = [];
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

	async function addOfflineBuildings() {
		const viewer = mapView.viewer;
		if (!viewer) return;

		const dataSource = await Cesium.GeoJsonDataSource.load('/maps/office/buildings.geojson');

		viewer.dataSources.add(dataSource);

		console.log('Building entities:', dataSource.entities.values.length);

		for (const entity of dataSource.entities.values.slice(0, 3)) {
			console.log('Entity:', entity);
			console.log('Polygon:', entity.polygon);
			console.log('Properties:', entity.properties);
		}

		for (const entity of dataSource.entities.values) {
			if (!entity.polygon) continue;

			const height =
				Number(entity.properties?.height_m?.getValue(Cesium.JulianDate.now())) || 5;

			entity.polygon.height = new Cesium.ConstantProperty(0);

			entity.polygon.extrudedHeight = new Cesium.ConstantProperty(height);

			entity.polygon.material = new Cesium.ColorMaterialProperty(
				Cesium.Color.GRAY.withAlpha(1.0)
			);

			entity.polygon.outline = new Cesium.ConstantProperty(true);

			entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK);
		}

		await viewer.flyTo(dataSource);

		invalidate();
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
		// The photorealistic tileset ships its own textured surface mesh. Leaving
		// the globe (ellipsoid + imagery + terrain) visible underneath makes the
		// two coplanar surfaces z-fight — the shimmer/splotchy effect from #365.
		// Hide the globe while photoreal is on; selections underneath are kept.
		viewer.scene.globe.show = false;
		// The base layer picker only changes imagery/terrain on the now-hidden
		// globe, so it's inert while photoreal is on — hide it to avoid the
		// "clicking does nothing" confusion. Selections are preserved underneath.
		if (viewer.baseLayerPicker?.container) {
			viewer.baseLayerPicker.container.style.display = 'none';
		}
	}

	function removeGooglePhotorealistic() {
		if (googlePhotorealistic && mapView.viewer) {
			mapView.viewer.scene.primitives.remove(googlePhotorealistic);
			googlePhotorealistic = null;
			// Restore the globe (and its preserved terrain/imagery selections).
			mapView.viewer.scene.globe.show = true;
			// Bring back the base layer picker hidden while photoreal was on.
			if (mapView.viewer.baseLayerPicker?.container) {
				mapView.viewer.baseLayerPicker.container.style.display = '';
			}
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
	async function updatePointPreview(
		point: MapPoint,
		icon?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = await drawPoint(
			point,
			icon ?? undefined,
			fillColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		mapView.viewer.entities.add(previewEntity);
		invalidate();
	}
	function updateCirclePreview(
		center: MapPoint,
		radius: number,
		borderColor?: string | null,
		fillColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawCircle(
			center,
			radius,
			borderColor ?? undefined,
			fillColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		mapView.viewer.entities.add(previewEntity);
		invalidate();
	}

	function updatePolylinePreview(
		points: MapPoint[],
		borderColor?: string | null,
		name?: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		previewEntity = drawPolyline(
			points,
			borderColor ?? undefined,
			name ?? undefined,
			id ?? undefined
		);
		// Add to map
		mapView.viewer.entities.add(previewEntity);
		invalidate();
	}

	function updatePolygonPreview(
		points: MapPoint[],
		borderColor: string | null,
		fillColor: string | null,
		name: string | null,
		id?: string
	) {
		// Remove old layer
		if (previewEntity) clearPreview();
		// Build new entity
		if (points.length < 2) return; // Don't build with no points
		if (points.length === 2)
			previewEntity = drawPolyline(
				points,
				borderColor ?? undefined,
				name ?? undefined,
				id ?? undefined
			);
		else
			previewEntity = drawPolygon(
				points,
				borderColor ?? undefined,
				fillColor ?? undefined,
				name ?? undefined,
				id ?? undefined
			);
		// Add to map
		mapView.viewer.entities.add(previewEntity);
		invalidate();
	}

	function clearPreview() {
		if (previewEntity) mapView.viewer.entities.remove(previewEntity);
		previewEntity = null;
		invalidate();
	}

	async function addGeoOverlay(geoOverlay: GeoOverlay) {
		if (!geoOverlay) return;

		// Clear preview before adding final geoOverlay
		clearPreview();

		// Point
		if (geoOverlay.type === 'Point') {
			const [lon, lat, alt] = geoOverlay.geometry.coordinates as [number, number, number];
			const point: MapPoint = {
				lat,
				lon,
				alt,
			};
			const newPoint = await drawPoint(
				point,
				geoOverlay.geometry.properties.icon,
				geoOverlay.geometry.properties.fillColor,
				geoOverlay.name,
				geoOverlay.uuid
			);
			console.log(newPoint);
			mapView.viewer.entities.add(newPoint);
		}
		// Circle
		if (geoOverlay.type === 'Circle') {
			const [lon, lat, alt] = geoOverlay.geometry.coordinates as [number, number, number];
			const center: MapPoint = {
				lat,
				lon,
				alt,
			};
			const newCircle = drawCircle(
				center,
				geoOverlay.geometry.properties.radius,
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.geometry.properties.fillColor,
				geoOverlay.name,
				geoOverlay.uuid
			);
			mapView.viewer.entities.add(newCircle);
		}
		// Polyline
		if (geoOverlay.type === 'LineString') {
			const coordinates = geoOverlay.geometry.coordinates as number[][];
			const newPolyline = drawPolyline(
				coordinates.map(([lon, lat, alt]) => ({
					lat,
					lon,
					alt,
				})),
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.name,
				geoOverlay.uuid
			);
			mapView.viewer.entities.add(newPolyline);
		}
		// Polygon
		if (geoOverlay.type === 'Polygon') {
			const coordinates = geoOverlay.geometry.coordinates as number[][];
			const newPolygon = drawPolygon(
				coordinates.map(([lon, lat, alt]) => ({
					lat,
					lon,
					alt,
				})),
				geoOverlay.geometry.properties.borderColor,
				geoOverlay.geometry.properties.fillColor,
				geoOverlay.name,
				geoOverlay.uuid
			);
			mapView.viewer.entities.add(newPolygon);
		}
		invalidate();
	}

	function removeGeoOverlay(geoOverlay: GeoOverlay) {
		const findGeoOverlay = mapView.viewer.entities.getById(geoOverlay.uuid);
		if (findGeoOverlay) mapView.viewer.entities.remove(findGeoOverlay);
		invalidate();
	}

	function enableClustering() {
		const viewer = mapView.viewer;
		const defaultDataSource = viewer.dataSourceDisplay.defaultDataSource;
		defaultDataSource.clustering.enabled = true;
		defaultDataSource.clustering.pixelRange = 45;
		defaultDataSource.clustering.minimumClusterSize = 2;
		invalidate();
	}

	function disableClustering() {
		const viewer = mapView.viewer;
		const defaultDataSource = viewer.dataSourceDisplay.defaultDataSource;
		defaultDataSource.clustering.enabled = false;
		invalidate();
	}

	return {
		init,
		destroy,
		addLayer,
		removeLayer,
		setCursor,
		onClick,
		onRightClick,
		onMouseMove,
		flyToPoint,
		updateMarker,
		addMarker,
		removeMarker,
		drawPoint,
		drawCircle,
		drawPolyline,
		drawPolygon,
		drawMissionWaypoints,
		clearMissionWaypoints,
		drawMissionPath,
		clearMissionPath,
		addTerrain,
		removeTerrain,
		addBuildings,
		addOfflineBuildings,
		removeBuildings,
		addGooglePhotorealistic,
		removeGooglePhotorealistic,
		addMapLayer,
		removeMapLayer,
		destroyAllLayers,
		rebuildMapLayers,
		updatePointPreview,
		updateCirclePreview,
		updatePolylinePreview,
		updatePolygonPreview,
		clearPreview,
		addGeoOverlay,
		removeGeoOverlay,
		enableClustering,
		disableClustering,
	};
}
