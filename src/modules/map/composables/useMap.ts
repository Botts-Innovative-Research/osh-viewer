import { useMapStore } from '@/stores/mapstore';
import { FoiLayer, useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import {
	createFOILayer,
	createGeoPTZLayer,
	createLocationLayer,
	createMapVisualizations,
	rebuildMapVisualizations,
} from '../mapVisualizations';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import { createCesiumAdapter } from '../adapters/cesium.adapter';
import { taskGeoPTZ } from '../services/geoPTZ.service';
import { MapAdapter } from '../adapters/types';
import { createLeafletAdapter } from '../adapters/leaflet.adapter';
import { useSettingsStore } from '@/stores/settingsstore';
import { isMapLayerCompatible, SupportedMapLayer } from '../supportedMapLayers';
import {
	connectDatasources as connect,
	disconnectDatasources as disconnect,
} from '@/modules/visualization/services/datasource.service';
import { getDistanceBetween, getGroundAltitude } from '../services/geospatial.service';
import { setLayerData } from '../services/foi.service';
import { MapPoint } from '@/modules/map/types';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import { useMissionStore } from '@/stores/missionstore';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import { storeToRefs } from 'pinia';
import { useGeoOverlayStore } from '@/stores/geooverlaystore';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';

export function useMap() {
	// STORES
	const mapStore = useMapStore();
	const mapInteractionStore = useMapInteractionStore();
	const visualizationStore = useVisualizationStore();
	const missionStore = useMissionStore();
	const settingsStore = useSettingsStore();
	const previewStore = useGeoOverlayPreviewStore();
	const geoOverlayStore = useGeoOverlayStore();

	// STORE REFS
	const {
		id: previewId,
		type: previewType,
		name: previewName,
		isGeofence: previewIsGeofence,
		geofenceMode: previewGeofenceMode,
		borderColor: previewBorderColor,
		fillColor: previewFillColor,
		icon: previewIcon,
		points: previewPoints,
		radius: previewRadius,
		circleCreationStep: previewCircleCreationStep,
	} = storeToRefs(previewStore);
	const { geoOverlays, hiddenGeoOverlays } = storeToRefs(geoOverlayStore);

	// MAP STATES
	const mapAdapter = ref<MapAdapter | null>(null);
	const mapType = computed(() => {
		return settingsStore.focusedMap;
	});

	// VISUALIZATIONS
	const mapItemLayers = ref<Map<string, SupportedMapLayer>>(new Map()); // Map of visualization ID to its corresponding visualization layer instance
	const listDataSourceInstances = ref<(typeof ConSysApi)[]>([]); // List of all connected datasource instances created for map visualizations
	const hiddenLayers = ref<Map<string, SupportedMapLayer>>(new Map()); // Hidden visualization IDs
	// GEOPTZ
	const geoPtzLayer = ref<typeof PointMarkerLayer | null>(null);
	// MISSION BUILDER
	const driveLocationLayer = ref(null);
	const homeLocationLayer = ref(null);
	// FOI
	const foiLayers = ref<{ layer: typeof PointMarkerLayer; props: any }[]>([]);

	/* MAP INITIALIZATION/DESTRUCTION/TOGGLE */
	async function initMap() {
		if (mapType.value === 'cesium') {
			mapAdapter.value = createCesiumAdapter();
			await mapAdapter.value?.init?.('mapContainer');

			// Rebuild map layers
			if (mapStore.cesiumMapLayers) {
				await mapAdapter.value.rebuildMapLayers?.(mapStore.cesiumMapLayers);
			}

			// Apply current settings
			if (settingsStore.enable3DTerrain) {
				await mapAdapter.value?.addTerrain?.();
			}
			if (settingsStore.enable3DBuildings) {
				await mapAdapter.value?.addBuildings?.();
			}
			if (settingsStore.enableGooglePhotorealistic) {
				await mapAdapter.value?.addGooglePhotorealistic?.();
			}
		} else if (mapType.value === 'leaflet') {
			mapAdapter.value = createLeafletAdapter();
			await mapAdapter.value?.init?.('mapContainer');
		}
		bindMapInteractions();
	}
	function destroyMap() {
		mapAdapter.value?.destroy();
		mapAdapter.value = null;
	}
	async function switchMap() {
		// Temporarily disconnect datasources
		disconnectDatasources();

		destroyMap();
		await initMap();

		// Rebuild layers
		const newLayers = rebuildMapVisualizations(mapItemLayers.value);
		newLayers.forEach((layer) => {
			// Type is 'marker' in osh-js, pass 'pointmarker' instead
			if (
				isMapLayerCompatible(layer.type === 'marker' ? 'pointmarker' : layer.type) &&
				!hiddenLayers.value.has(layer.id)
			)
				mapAdapter.value?.addLayer(layer);
		});
		mapItemLayers.value = newLayers;

		// Reconnect datasources
		connectDatasources();

		await rebuildFoiLayers(); // Rebuild all FOIs
		rebuildGeoOverlayLayers(); // Rebuild GeoOverlays

		// Rebuild all waypoints per system
		for (const [, systemWaypoints] of missionStore.missionWaypointsPerSystem) {
			mapAdapter.value?.drawMissionWaypoints(systemWaypoints);
			drawMissionPath(systemWaypoints);
		}
		if (driveLocationLayer.value && mapStore.currentLLA) {
			const loc = driveLocationLayer.value.properties.location;
			driveLocationLayer.value = null;
			await addDriveLocationLayer(loc.x, loc.y);
		}
		if (homeLocationLayer.value && mapStore.currentLLA) {
			const loc = homeLocationLayer.value.properties.location;
			homeLocationLayer.value = null;
			await addHomeLocationLayer(loc.x, loc.y);
		}
	}
	watch(mapType, async () => {
		await switchMap();
	});

	/* DATASOURCE MANAGEMENT */
	function connectDatasources() {
		connect(listDataSourceInstances);
	}
	function disconnectDatasources() {
		disconnect(listDataSourceInstances);
	}

	/* CREATE/DELETE VISUALIZATIONS */
	watch(
		() => visualizationStore.mapVisualizations.map((v) => v.id),
		(newIds, oldIds) => {
			const removedIds = oldIds?.filter(
				(oldId) => !newIds.some((id) => id === oldId || oldId === id)
			);
			const addedIds = newIds?.filter(
				(newId) => !oldIds?.some((id) => id === newId || newId === id)
			);

			// Handle removed visualizations
			if (removedIds) {
				removedIds.forEach((id: string) => deleteVisualization(id));
			}

			//Handle added visualizations
			if (addedIds) {
				const newOSHVisualizations: OSHVisualization[] = addedIds
					.map((id) => visualizationStore.getVisualizationById(id))
					.filter(Boolean) as OSHVisualization[];

				newOSHVisualizations.forEach(async (viz: OSHVisualization) => {
					await addVisualization(viz);
				});
			}
		},
		{ deep: true }
	);
	async function addVisualization(viz: OSHVisualization) {
		// If parent, skip - no layer to build
		if (viz.isParentVisualization()) return;
		// If not parent, add directly
		else {
			const result = await createMapVisualizations(viz);
			if (!result) return;

			const { vizLayer, dsInstances } = result;

			console.log(`Created ${viz.type} Visualization:`, vizLayer);
			listDataSourceInstances.value.push(...dsInstances); // Push dsInstances to list of all active ds
			mapItemLayers.value.set(viz.id, vizLayer); // Store vizLayer instance for this viz.id

			// Add layer to map, if compatible with current map type
			if (isMapLayerCompatible(viz.type)) mapAdapter.value?.addLayer(vizLayer); // Add vizLayer to map
		}
	}
	async function deleteVisualization(vizId: string) {
		const removedDsIds: string[] = [];

		// Find viz layer
		const mapLayer = mapItemLayers.value.get(vizId);
		if (!mapLayer) return; // Skip if no layer found for this vizId (including parent viz)

		// Collect ds IDs
		removedDsIds.push(...mapLayer.dataSourceIds);

		// Disconnect and remove datasources
		listDataSourceInstances.value = listDataSourceInstances.value.filter(
			(dsInstance: typeof ConSysApi) => {
				// Find matching datasource IDs to remove
				if (removedDsIds.includes(dsInstance.id)) {
					console.log('Disconnecting datasource:', dsInstance.id);
					dsInstance.disconnect();
					return false; // Remove from list
				}
				return true; // Keep in list
			}
		);

		// Remove layer from the actual map safely
		await mapAdapter.value?.removeLayer(mapLayer);

		// Remove layer from mapItemLayers
		mapItemLayers.value.delete(vizId);
	}

	/* FOI */
	watch(
		() => visualizationStore.foiLayers,
		(newLayers, oldLayers) => {
			const addedLayers = newLayers?.filter(
				(newLayer) => !oldLayers?.some((layer: any) => layer === newLayer)
			);
			const removedLayers = oldLayers?.filter(
				(oldLayer) => !newLayers.some((layer: any) => layer === oldLayer)
			);
			if (addedLayers) {
				addedLayers.forEach(async (layer) => {
					await addFoiLayer(layer);
				});
			}
			if (removedLayers) {
				removedLayers.forEach((layer) => {
					removeFoiLayer(layer);
				});
			}
		},
		{ deep: true, immediate: true }
	);
	async function addFoiLayer(layer: FoiLayer) {
		const result = await createFOILayer(layer);
		if (result) {
			mapAdapter.value?.addLayer(result.layer);
			if (result.props) mapAdapter.value?.updateMarker(result.props);
			foiLayers.value.push({ layer: result.layer, props: result.props });
		}
	}
	function removeFoiLayer(layer: FoiLayer) {
		const remove = foiLayers.value.find((foiLayer) => {
			return foiLayer.layer.properties.id === layer.geometry.id;
		});
		mapAdapter.value?.removeLayer(remove?.layer);
		foiLayers.value = foiLayers.value.filter((foiLayer) => foiLayer.layer !== remove?.layer);
	}
	async function rebuildFoiLayers() {
		for (const foi of foiLayers.value) {
			foi.props = await setLayerData(foi.layer);
			mapAdapter.value?.addLayer(foi.layer);
			mapAdapter.value?.updateMarker(foi.props);
		}
	}

	/** MAP INTERACTIONS */
	function bindMapInteractions() {
		if (!mapAdapter.value) return;

		/* MOUSE CLICK */
		mapAdapter.value.onClick(async (lat, lon, alt) => {
			// Point GeoOverlay
			if (mapInteractionStore.isGeoOverlayPointSelected) {
				previewPoints.value = [{ lat, lon, alt }];
			}
			// Circle GeoOverlay
			if (mapInteractionStore.isGeoOverlayCircleSelected) {
				// Handle second click FIRST - radius
				if (previewCircleCreationStep.value === 'radius') {
					// Calculate final radius in meters
					previewRadius.value = getDistanceBetween(previewPoints.value[0], {
						lat,
						lon,
						alt,
					});
					// Deselect tool
					previewCircleCreationStep.value = null;
					mapInteractionStore.deselectTool('geoOverlayCircle');
				}
				// Handle first click AFTER - center
				else if (previewCircleCreationStep.value === 'center') {
					previewPoints.value = [{ lat, lon, alt }];
					previewCircleCreationStep.value = 'radius';
				}
			}
			// Polyline GeoOverlay
			if (mapInteractionStore.isGeoOverlayLineStringSelected) {
				previewPoints.value.push({ lat, lon, alt });
			}
			// Polygon GeoOverlay
			if (mapInteractionStore.isGeoOverlayPolygonSelected) {
				previewPoints.value.push({ lat, lon, alt });
			}

			// GeoPTZ
			if (mapInteractionStore.isGeoPTZSelected && mapInteractionStore.selectedGeoPTZ) {
				// Calculate alt if needed
				const calcAlt = alt ?? (await getGroundAltitude(lon, lat)) ?? 0;

				// Create pointmarker
				const result = await createGeoPTZLayer(
					{ lon, lat, alt: calcAlt },
					mapInteractionStore.selectedGeoPTZ
				);
				if (result) {
					// Remove old pointmarker
					mapAdapter.value?.removeLayer(geoPtzLayer.value);
					geoPtzLayer.value = result.layer;

					// Add new pointmarker
					mapAdapter.value?.addLayer(geoPtzLayer.value);
					if (result.props) mapAdapter.value?.updateMarker(result.props);

					// Task GeoPTZ
					taskGeoPTZ(lat, lon, calcAlt);
				}
			}
			// Mission Planner (enabled by interaction mode)
			if (mapInteractionStore.isMissionWaypointSelected) mapStore.setCurrentLLA(lat, lon, 0);
			// Drive Location
			if (mapInteractionStore.isDriveLocationSelected) {
				mapStore.setCurrentLLA(lat, lon, 0);
				await addDriveLocationLayer(lon, lat);
			}
			// Home Location
			if (mapInteractionStore.isHomeLocationSelected) {
				mapStore.setCurrentLLA(lat, lon, 0);
				await addHomeLocationLayer(lon, lat);
			}
			// Add additional onClick functions
		});

		/* MOUSE MOVE */
		mapAdapter.value.onMouseMove(async (lat: number, lon: number, alt: number) => {
			// Circle GeoOverlay
			if (
				mapInteractionStore.isGeoOverlayCircleSelected &&
				previewCircleCreationStep.value === 'radius'
			) {
				// Calculate radius in meters
				previewRadius.value = getDistanceBetween(previewPoints.value[0], {
					lat,
					lon,
					alt,
				});
			}
		});
	}
	watch(
		() => mapInteractionStore.mapCursorMode,
		(mode) => {
			if (mode) {
				mapAdapter.value?.setCursor(mode);
			}
		}
	);
	watch(
		() => mapStore.selectedMapItem,
		(newVal) => {
			if (!newVal) return; // Only fly when a map item is selected

			const layer = mapItemLayers.value.get(newVal.id);
			if (!layer) return;

			const layerProps = layer.getCurrentProps();
			const location =
				layerProps.location ?? layerProps.position ?? layerProps.locations?.[0]; // Handle location for PM/LoB, position for ellipse, locations[0] for polyline
			if (!location) return;

			mapAdapter.value?.flyToPoint(location);
		}
	);
	watch(
		() => visualizationStore.hiddenLayers,
		async () => {
			for (const viz of visualizationStore.mapVisualizations) {
				// Handle parent viz
				if (viz.isParentVisualization()) {
					viz.children.forEach(async (child: OSHVisualization) => {
						await toggleVizVisibility(
							child,
							visualizationStore.isMapLayerVisible(child.id)
						);
					});
				} else {
					await toggleVizVisibility(viz, visualizationStore.isMapLayerVisible(viz.id));
				}
			}
		},
		{ deep: true }
	);
	async function toggleVizVisibility(viz: OSHVisualization, isVisible: boolean) {
		// Show/rebuild visualization
		if (isVisible) {
			if (hiddenLayers.value.has(viz.id)) {
				hiddenLayers.value.delete(viz.id); // Remove from hidden layers
				addVisualization(viz); // Rebuild viz
				console.log('Rebuilt visualization:', viz);
			}
		}
		// Hide/delete visualization
		else {
			hiddenLayers.value.set(viz.id, viz); // Add to hidden layers
			await deleteVisualization(viz.id); // Delete viz from map
			console.log('Hid visualization:', viz);
		}
	}

	/* GEO OVERLAY */
	function rebuildGeoOverlayLayers() {
		for (const geoOverlay of geoOverlays.value) {
			// Only rebuild visible geo overlays
			if (!hiddenGeoOverlays.value.has(geoOverlay.uuid))
				mapAdapter.value?.addGeoOverlay(geoOverlay);
		}
	}
	watch(
		hiddenGeoOverlays,
		async (newList, oldList) => {
			console.log(newList, oldList);
			const removedIds = new Set([...oldList].filter((id) => !newList.has(id)));
			const addedIds = new Set([...newList].filter((id) => !oldList.has(id)));
			console.log(removedIds, addedIds);
			// Removed hidden geo overlays -> SHOW
			if (removedIds.size > 0) {
				removedIds.forEach((id: string) => {
					let overlay = geoOverlayStore.getGeoOverlayById(id);
					if (overlay) toggleGeoOverlayVisibility(overlay, true);
				});
			}
			// Added hidden geo overlays -> HIDE
			if (addedIds.size > 0) {
				addedIds.forEach((id: string) => {
					let overlay = geoOverlayStore.getGeoOverlayById(id);
					if (overlay) toggleGeoOverlayVisibility(overlay, false);
				});
			}
		},
		{ deep: true }
	);
	function toggleGeoOverlayVisibility(geoOverlay: GeoOverlay, isVisible: boolean) {
		// Rebuild hidden -> show
		if (isVisible) mapAdapter.value?.addGeoOverlay(geoOverlay);
		// Delete overlay -> hide
		else mapAdapter.value?.removeGeoOverlay(geoOverlay);
	}
	watch(
		geoOverlays,
		(newOverlays, oldOverlays) => {
			const added = newOverlays.filter(
				(newOverlay) =>
					!oldOverlays.some((oldOverlay) => oldOverlay.uuid === newOverlay.uuid)
			);
			const removed = oldOverlays.filter(
				(oldOverlay) =>
					!newOverlays.some((newOverlay) => newOverlay.uuid === oldOverlay.uuid)
			);

			// Remove old geo overlays
			if (removed.length) {
				removed.map((removedOverlay: GeoOverlay) => {
					mapAdapter.value?.removeGeoOverlay(removedOverlay);
				});
			}
			// Add new geo overlays
			if (added.length) {
				added.map((newOverlay: GeoOverlay) => {
					mapAdapter.value?.addGeoOverlay(newOverlay);
				});
			}
		},
		{ deep: true }
	);
	watch(previewType, () => {
		mapAdapter.value?.clearPreview();
	});
	watch(
		previewPoints,
		(newPoints) => {
			// Point
			if (previewType.value === 'Point') {
				const point = newPoints[0];
				if (!point) return;
				mapAdapter.value?.updatePointPreview(
					point,
					previewFillColor.value,
					previewIcon.value,
					previewName.value
				);
			}
			// Circle
			if (previewType.value === 'Circle') {
				const center = newPoints[0];
				if (!center) return;
				mapAdapter.value?.updateCirclePreview(
					center,
					previewRadius.value ?? 0, // Default radius = 0
					previewBorderColor.value,
					previewFillColor.value
				);
			}
			// Polyline
			if (previewType.value === 'LineString')
				mapAdapter.value?.updatePolylinePreview(newPoints, previewBorderColor.value);
			// Polygon
			if (previewType.value === 'Polygon') {
				mapAdapter.value?.updatePolygonPreview(
					newPoints,
					previewBorderColor.value,
					previewFillColor.value
				);
			}
		},
		{ deep: true }
	);
	watch(
		previewRadius,
		(newRadius) => {
			const center = previewPoints.value[0];
			if (!center) return;
			mapAdapter.value?.updateCirclePreview(
				center,
				newRadius ?? 0, // Default radius = 0
				previewBorderColor.value,
				previewFillColor.value
			);
		},
		{ deep: true }
	);
	watch(
		previewBorderColor,
		(newColor) => {
			// Circle
			if (previewType.value === 'Circle') {
				const center = previewPoints.value[0];
				if (!center) return;
				mapAdapter.value?.updateCirclePreview(
					center,
					previewRadius.value ?? 0, // Default radius = 0
					newColor,
					previewFillColor.value
				);
			}
			// Polyline
			if (previewType.value === 'LineString')
				mapAdapter.value?.updatePolylinePreview(previewPoints.value, newColor);
			// Polygon
			if (previewType.value === 'Polygon')
				mapAdapter.value?.updatePolygonPreview(
					previewPoints.value,
					newColor,
					previewFillColor.value
				);
		},
		{ deep: true }
	);
	watch(
		previewFillColor,
		(newColor) => {
			// Point
			if (previewType.value === 'Point')
				mapAdapter.value?.updatePointPreview(
					previewPoints.value[0],
					newColor,
					previewIcon.value,
					previewName.value
				);
			// Circle
			if (previewType.value === 'Circle') {
				const center = previewPoints.value[0];
				if (!center) return;
				mapAdapter.value?.updateCirclePreview(
					center,
					previewRadius.value ?? 0, // Default radius = 0
					previewBorderColor.value,
					newColor
				);
			}
			// Polygon
			if (previewType.value === 'Polygon')
				mapAdapter.value?.updatePolygonPreview(
					previewPoints.value,
					previewBorderColor.value,
					newColor
				);
		},
		{ deep: true }
	);
	watch(previewIcon, (newIcon) => {
		// ONLY for Point
		if (previewType.value !== 'Point' || !newIcon) return;
		mapAdapter.value?.updatePointPreview(
			previewPoints.value[0],
			previewFillColor.value,
			newIcon,
			previewName.value
		);
	});
	watch(previewName, (newName) => {
		// Point
		if (previewType.value === 'Point') {
			mapAdapter.value?.updatePointPreview(
				previewPoints.value[0],
				previewFillColor.value,
				previewIcon.value,
				newName
			);
		}
		// TODO: Circle, Polyline, Polygon
	});

	/* GEOPTZ */
	watch(
		() => mapInteractionStore.isGeoPTZSelected,
		(selected) => {
			// Remove old pointmarker on selection change
			if (geoPtzLayer.value) mapAdapter.value?.removeLayer(geoPtzLayer.value);
			geoPtzLayer.value = null;
		}
	);

	/* DRIVE LOCATION */
	async function addDriveLocationLayer(lon: number, lat: number) {
		if (!mapAdapter.value) return;
		removeDriveLocationLayer();

		const marker = await mapAdapter.value.drawPoint(
			{ lon, lat, alt: 0 },
			'/icons/waypoint/round-pin.png',
			'#00BFFF',
			'Drive to Location'
		);

		mapAdapter.value.addMarker(marker);
		driveLocationLayer.value = marker;
	}

	function removeDriveLocationLayer() {
		if (driveLocationLayer.value) mapAdapter.value?.removeMarker(driveLocationLayer.value);
		driveLocationLayer.value = null;
	}
	watch(
		() => mapInteractionStore.isDriveLocationSelected,
		(selected) => {
			removeDriveLocationLayer();
		}
	);

	/* HOME LOCATION */
	async function addHomeLocationLayer(lon: number, lat: number) {
		if (!mapAdapter.value) return;

		removeHomeLocationLayer();

		const marker = await mapAdapter.value.drawPoint(
			{ lon, lat, alt: 0 },
			'/icons/waypoint/home-map-marker.png',
			'#bd1616',
			'Home Location'
		);

		mapAdapter.value.addMarker(marker);
		homeLocationLayer.value = marker;
	}
	function removeHomeLocationLayer() {
		if (homeLocationLayer.value) mapAdapter.value?.removeMarker(homeLocationLayer.value);
		homeLocationLayer.value = null;
	}
	watch(
		() => mapInteractionStore.isHomeLocationSelected,
		(selected) => {
			removeHomeLocationLayer();
		}
	);

	/* MISSION BUILDER */
	watch(
		() => missionStore.missionWaypoints,
		(waypoints) => {
			if (!mapAdapter.value) return;

			clearMission();

			for (const [, systemWaypoints] of missionStore.missionWaypointsPerSystem) {
				mapAdapter.value.drawMissionWaypoints(systemWaypoints);
				drawMissionPath(systemWaypoints);
			}
		}
	);
	function drawMissionPath(waypoints: MapPoint[]) {
		if (!mapAdapter.value) return;

		// Handle polyline if waypoints >= 2
		if (waypoints.length >= 2) {
			mapAdapter.value.drawMissionPath(waypoints);
		}
	}
	function clearMission() {
		mapAdapter.value?.clearMissionWaypoints();
		mapAdapter.value?.clearMissionPath();
	}

	/* CESIUM-ONLY FEATURES */
	watch(
		() => settingsStore.enable3DTerrain,
		async (enabled) => {
			if (!mapAdapter.value) return;

			if (enabled) {
				await mapAdapter.value.addTerrain?.();
			} else {
				mapAdapter.value.removeTerrain?.();
			}
		}
	);
	watch(
		() => settingsStore.enable3DBuildings,
		async (enabled) => {
			if (!mapAdapter.value) return;

			if (enabled) {
				await mapAdapter.value.addBuildings?.();
			} else {
				mapAdapter.value.removeBuildings?.();
			}
		}
	);
	watch(
		() => settingsStore.enableGooglePhotorealistic,
		async (enabled) => {
			if (!mapAdapter.value) return;

			if (enabled) {
				await mapAdapter.value.addGooglePhotorealistic?.();
			} else {
				mapAdapter.value.removeGooglePhotorealistic?.();
			}
		}
	);
	watch(
		() => mapStore.cesiumMapLayers.map((l) => l.id),
		(newIds, oldIds = []) => {
			if (!mapAdapter.value || mapType.value !== 'cesium') return;

			const newSet = new Set(newIds);
			const oldSet = new Set(oldIds);

			// ADD
			for (const layer of mapStore.cesiumMapLayers) {
				if (!oldSet.has(layer.id)) {
					mapAdapter.value.addMapLayer?.(layer);
				}
			}

			// REMOVE
			for (const id of oldIds) {
				if (!newSet.has(id)) {
					mapAdapter.value.removeMapLayer?.(id);
				}
			}
		},
		{ deep: true }
	);

	onMounted(async () => {
		await initMap();
		await rebuildFoiLayers();
		rebuildGeoOverlayLayers();
	});

	return {
		mapAdapter,
		initMap,
		destroyMap,
		switchMap,
	};
}
