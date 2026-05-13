import { useMapStore } from '@/stores/mapstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import {
	createMapVisualizations,
	createWaypointLayer,
	rebuildMapVisualizations,
} from '../mapVisualizations';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { createCesiumAdapter } from '../adapters/cesium.adapter';
import { taskGeoPTZ } from '../services/geoPTZ.service';
import { MapAdapter } from '../adapters/types';
import { createLeafletAdapter } from '../adapters/leaflet.adapter';
import { useSettingsStore } from '@/stores/settingsstore';

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
	const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map());
	// List of all connected datasource instances created for map visualizations
	const listDataSourceInstances = ref<SweApi[]>([]);
	// Array of waypoint Pointmarkers for mission builder
	const waypointLayers = ref<PointMarkerLayer[]>([]);

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
			mapAdapter.value?.addLayer(layer);
		});
		mapItemLayers.value = newLayers;

		// Reconnect datasources
		connectDatasources();
	}
	watch(mapType, async () => {
		await switchMap();
	});

	/* DATASOURCE MANAGEMENT */
	function connectDatasources() {
		listDataSourceInstances.value.forEach((ds: any) => ds.connect());
	}
	function disconnectDatasources() {
		listDataSourceInstances.value.forEach((ds: any) => ds.disconnect());
	}

	/* CREATE/DELETE VISUALIZATIONS */
	watch(
		() => visualizationStore.mapVisualizations.map((v) => v.id),
		(newIds, oldIds) => {
			const removedIds = oldIds?.filter((oldId) => !newIds.some((id) => id === oldId));
			const addedIds = newIds?.filter((newId) => !oldIds?.some((id) => id === newId));

			// Handle removed visualizations
			if (removedIds) deleteVisualizations(removedIds);

			//Handle added visualizations
			if (addedIds) {
				const newOSHVisualizations: OSHVisualization[] = addedIds
					.map((id) => visualizationStore.getVisualizationById(id))
					.filter(Boolean) as OSHVisualization[];

				newOSHVisualizations.forEach((viz: OSHVisualization) => {
					addVisualization(viz);
				});
			}
		},
		{ immediate: true, deep: true }
	);
	function addVisualization(viz: OSHVisualization) {
		const result = createMapVisualizations(viz);
		if (!result) return;

		const { vizLayer, dsInstances } = result;

		console.log(`Created ${viz.type} Visualization:`, vizLayer);
		listDataSourceInstances.value.push(...dsInstances); // Push dsInstances to list of all active ds
		mapItemLayers.value.set(viz.id, vizLayer); // Store vizLayer instance for this viz.id
		mapAdapter.value?.addLayer(vizLayer); // Add vizLayer to map
	}
	function deleteVisualizations(removedVizIds: string[]) {
		const removedDsIds: string[] = [];

		for (const vizId of removedVizIds) {
			const layer = mapItemLayers.value.get(vizId);
			if (!layer) continue; // Skip if no layer found for this vizId

			// Collect ds IDs
			removedDsIds.push(...layer.dataSourceIds);

			// Remove layer from the actual map safely
			mapAdapter.value?.removeLayer(layer);

			// Remove layer from mapItemLayers
			mapItemLayers.value.delete(vizId);
		}

		// Disconnect and remove datasources
		listDataSourceInstances.value = listDataSourceInstances.value.filter(
			(dsInstance: SweApi) => {
				// Find matching datasource IDs to remove
				if (removedDsIds.includes(dsInstance.id)) {
					console.log('Disconnecting datasource:', dsInstance.id);
					dsInstance.disconnect();
					return false; // Remove from list
				}
				return true; // Keep in list
			}
		);
	}

	/** MAP INTERACTIONS */
	function bindMapInteractions() {
		if (!mapAdapter.value) return;

		mapAdapter.value.onClick((lat, lon, alt) => {
			if (mapStore.isGeoPTZSelected) taskGeoPTZ(lat, lon, alt);
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
			const location = layer.getCurrentProps().location;
			if (!location) return;

			mapAdapter.value?.flyToPoint(location);
		}
	);
	watch(
		() => visualizationStore.layerVisibility.entries(),
		(entries) => {
			for (const [layerId, isVisible] of entries) {
				const layer = mapItemLayers.value.get(layerId);
				if (!layer) continue;

				const ids: string[] = layer.getIds();

				ids.map((id: string) => {
					mapAdapter.value?.toggleLayerVisibility(id, isVisible);
				});
			}
		}
	);

	/* GEOPTZ */
	watch(
		() => mapStore.selectedGeoPTZ,
		(geoPtz, oldGeoPtz) => {
			// If had value, delete
			if (oldGeoPtz?.length) deleteVisualizations([oldGeoPtz[0].id]);
			// If has a new value, create new
			if (geoPtz?.length) addVisualization(geoPtz[0]);
		},
		{ deep: true }
	);
	watch([() => settingsStore.geoPtzIcon, () => settingsStore.geoPtzIconColor], () => {
		// Rebuild viz on icon change
		const currentGeoPtz = mapStore.selectedGeoPTZ;
		if (!currentGeoPtz?.length) return;

		// Delete and make new
		deleteVisualizations([currentGeoPtz[0].id]);
		addVisualization(currentGeoPtz[0]);
	});

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
