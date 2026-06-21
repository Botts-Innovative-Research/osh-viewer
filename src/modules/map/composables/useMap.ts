import { useMapStore } from '@/stores/mapstore';
import { FoiLayer, useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import {
	createFOILayer,
	createGeoPTZLayer,
	createMapVisualizations,
	createWaypointLayer,
	rebuildMapVisualizations,
} from '../mapVisualizations';
import { Geometry, OSHVisualization } from '@/lib/OSHConnectDataStructs';
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
import { getGroundAltitude } from '../services/altitude.service';
import { setLayerData } from '../services/foi.service';

export function useMap() {
	// Stores
	const mapStore = useMapStore();
	const visualizationStore = useVisualizationStore();
	const settingsStore = useSettingsStore();

	// Map state
	const mapAdapter = ref<MapAdapter | null>(null);
	const mapType = computed(() => {
		return settingsStore.focusedMap;
	});

	// Map of visualization ID to its corresponding visualization layer instance
	const mapItemLayers = ref<Map<string, SupportedMapLayer>>(new Map());
	// List of all connected datasource instances created for map visualizations
	const listDataSourceInstances = ref<(typeof ConSysApi)[]>([]);
	// Current GeoPTZ layer
	const geoPtzLayer = ref<typeof PointMarkerLayer | null>(null);
	// Array of waypoint Pointmarkers for mission builder
	const waypointLayers = ref<(typeof PointMarkerLayer)[]>([]);
	// FOI Layers
	const foiLayers = ref<{ layer: typeof PointMarkerLayer; props: any }[]>([]);
	// Hidden visualization IDs
	const hiddenLayers = ref<Map<string, SupportedMapLayer>>(new Map());

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

		// Rebuild all FOIs
		foiLayers.value.forEach(async (foi) => {
			foi.props = await setLayerData(foi.layer);
			mapAdapter.value?.addLayer(foi.layer);
			mapAdapter.value?.updateMarker(foi.props);
		});
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
				(newLayer) =>
					!oldLayers?.some((layer: any) => layer.geometry.id === newLayer.geometry.id)
			);
			const removedLayers = oldLayers?.filter(
				(oldLayer) =>
					!newLayers.some((layer: any) => layer.geometry.id === oldLayer.geometry.id)
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

	/** MAP INTERACTIONS */
	function bindMapInteractions() {
		if (!mapAdapter.value) return;

		mapAdapter.value.onClick(async (lat, lon, alt) => {
			// GeoPTZ
			if (mapStore.isGeoPTZSelected && mapStore.selectedGeoPTZ) {
				// Calculate alt if needed
				const calcAlt = alt ?? (await getGroundAltitude(lon, lat)) ?? 0;

				// Create pointmarker
				const result = await createGeoPTZLayer(
					{ lon, lat, alt: calcAlt },
					mapStore.selectedGeoPTZ
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
			// Mission Planner
			if (mapStore.selectedWaypoints) mapStore.setCurrentLLA(lat, lon, 0);
			// Add additional onClick functions
		});
	}
	watch(
		() => mapStore.mapCursorMode,
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
			const location = layerProps.location ?? layerProps.position ?? layerProps.locations[0]; // Handle location for PM/LoB, position for ellipse, locations[0] for polyline
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

	/* GEOPTZ */
	watch(
		() => mapStore.isGeoPTZSelected,
		(selected) => {
			// Remove old pointmarker on selection change
			if (geoPtzLayer.value) mapAdapter.value?.removeLayer(geoPtzLayer.value);
			geoPtzLayer.value = null;
		}
	);

	/* MISSION BUILDER */
	watch(
		() => mapStore.clearMissionWaypointsMarkers,
		(clear: boolean) => {
			if (!clear || !mapAdapter.value) return;

			clearMission();
			mapStore.resetClearWaypointMarkersSignal();
		}
	);
	watch(
		() => mapStore.missionWaypoints,
		async (waypoints) => {
			if (!mapAdapter.value) return;

			// Remove waypoints
			clearMission();

			// Add waypoints
			for (const [index, waypoint] of waypoints.entries()) {
				const result = await createWaypointLayer(waypoint, index.toString());
				if (result) {
					mapAdapter.value?.addLayer(result.layer);
					waypointLayers.value.push(result.layer);
					if (result.props) mapAdapter.value?.updateMarker(result.props);
				}
			}

			// Handle polyline if waypoints >= 2
			if (waypoints.length >= 2) {
				mapAdapter.value.drawMissionPath(waypoints);
			}
		}
	);
	function clearMission() {
		for (const layer of waypointLayers.value) {
			mapAdapter.value?.removeLayer(layer);
		}
		waypointLayers.value = [];

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

	onMounted(() => {
		initMap();
	});

	return {
		mapAdapter,
		initMap,
		destroyMap,
		switchMap,
	};
}
