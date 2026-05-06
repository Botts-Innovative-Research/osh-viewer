import { useMapStore } from '@/stores/mapstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { createMapVisualizations, rebuildMapVisualizations } from '../mapVisualizations';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { createCesiumAdapter } from '../adapters/cesium.adapter';
import { taskGeoPTZ } from '../geoPTZ.service';
import { MapAdapter } from '../adapters/types';
import { createLeafletAdapter } from '../adapters/leaflet.adapter';

export function useMap() {
	// Stores
	const mapStore = useMapStore();
	const visualizationStore = useVisualizationStore();

	// Map state
	const mapAdapter = ref<MapAdapter | null>(null);
	const mapType = computed(() => {
		return mapStore.focusedMap;
	});

	// Map of visualization ID to its corresponding visualization layer instance
	const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map());
	// List of all connected datasource instances created for map visualizations
	const listDataSourceInstances = ref<SweApi[]>([]);

	/* MAP INITIALIZATION/DESTRUCTION/TOGGLE */
	async function initMap() {
		if (mapType.value === 'cesium') {
			mapAdapter.value = createCesiumAdapter();
		} else if (mapType.value === 'leaflet') {
			mapAdapter.value = createLeafletAdapter();
		}
		await mapAdapter.value?.init?.('mapContainer');
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
					console.log(`Added visualization with id ${viz.id} to map.`);
				})
			}
		},
		{ immediate: true, deep: true }
	);
	function addVisualization(viz: OSHVisualization) {
		console.log('[Map] Creating viz layer for:', viz.id);
		
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
			console.log('Map click:', lat, lon, alt);
			if (mapStore.isGeoPTZSelected) taskGeoPTZ(lat, lon, alt);
			if (mapStore.selectedWaypoints) mapStore.setCurrentLLA(lat, lon, 0);
			// Add additional onClick functions
		})
	}
	// Map cursor styling
	watch(
		() => mapStore.mapCursorMode,
		(mode) => {
			if (mode) {
				mapAdapter.value?.setCursor(mode);
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

	/* CESIUM */
	// watch(
	// 	() => mapStore.cesiumMapLayers,
	// 	(layers) => {
	// 		if (mapType.value !== 'cesium' || !mapView.value) return;
	// 		syncCesiumLayers(layers);
	// 	},
	// 	{ deep: true }
	// );
	// function syncCesiumLayers(layers: MapLayer[]) {
	// 	// Add new layers
	// 	layers.forEach((layer: any) => {
	// 		if (!renderedCesiumLayers.value.has(layer.id)) {
	// 			const ref = addLayerToCesium(layer);
	// 			renderedCesiumLayers.value.set(layer.id, ref);
	// 		}
	// 	});

	// 	// Remove deleted layers
	// 	for (const [id, ref] of renderedCesiumLayers.value.entries()) {
	// 		if (!layers.some((layer: any) => layer.id === id)) {
	// 			removeLayerFromCesium(ref);
	// 			renderedCesiumLayers.value.delete(id);
	// 		}
	// 	}
	// }

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
