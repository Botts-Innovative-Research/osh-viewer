import { useMapStore } from '@/stores/mapstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { createMapVisualizations, rebuildMapVisualizations } from '../mapVisualizations';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { createCesiumMap, handleCesiumClick } from '../cesiumAdapter';
import { createLeafletMap, handleLeafletClick } from '../leafletAdapter';
import { taskGeoPTZ } from '../geoPTZ.service';

export function useMap() {
	// Stores
	const mapStore = useMapStore();
	const visualizationStore = useVisualizationStore();

	// Map state
	const mapView = ref<any>(null);
	const mapType = computed(() => {
		return mapStore.focusedMap;
	});

	// Map of visualization ID to its corresponding visualization layer instance
	const mapItemLayers = ref<Map<string, PointMarkerLayer | LoBLayer>>(new Map());
	// List of all connected datasource instances created for map visualizations
	const listDataSourceInstances = ref<SweApi[]>([]);

	/* MAP INITIALIZATION/DESTRUCTION */
	async function initMap() {
		if (mapType.value === 'leaflet') {
			mapView.value = createLeafletMap('mapContainer');
		} else if (mapType.value === 'cesium') {
			mapView.value = await createCesiumMap('mapContainer');
		}
	}
	async function destroyMap() {
		if (!mapView.value) return;
		mapView.value.destroy();
		mapView.value = null;
	}
	async function switchMap() {
		// Temporarily disconnect datasources
		disconnectDatasources();

		await destroyMap();
		await initMap();

		// Rebuild layers
		const newLayers = rebuildMapVisualizations(mapItemLayers.value);
		newLayers.forEach((layer) => {
			mapView.value.addLayer(layer);
		});
		mapItemLayers.value = newLayers;

		// Reconnect datasources
		connectDatasources();
	}

	/** TOGGLE MAP */
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
			// Handle removed visualizations
			const removedIds = oldIds?.filter((oldId) => !newIds.some((id) => id === oldId));
			if (removedIds) deleteMapVisualizations(removedIds);

			//Handle added visualizations
			const addedIds = newIds?.filter((newId) => !oldIds?.some((id) => id === newId));
			if (addedIds) {
				const newOSHVisualizations: OSHVisualization[] = addedIds
					.map((id) => visualizationStore.getVisualizationById(id))
					.filter(Boolean) as OSHVisualization[];

				for (const viz of newOSHVisualizations) {
					addMapVisualizationLayer(viz);
					console.log(`Added visualization with id ${viz.id} to map.`);
				}
			}
		},
		{ immediate: true, deep: true }
	);
	function addMapVisualizationLayer(viz: OSHVisualization) {
		console.log('[Map] Creating viz layer for:', viz.id);
		const result = createMapVisualizations(viz);
		if (result) {
			const { vizLayer, dsInstances } = result;
			console.log(`Created ${viz.type} Visualization:`, vizLayer);
			listDataSourceInstances.value.push(...dsInstances); // Push dsInstances to list of all active ds
			mapItemLayers.value.set(viz.id, vizLayer); // Store vizLayer instance for this viz.id
			mapView.value.addLayer(vizLayer); // Add vizLayer to map
		}
	}
	function deleteMapVisualizations(removedVizIds: string[]) {
		const removedDsIds: string[] = [];

		for (const vizId of removedVizIds) {
			const layer = mapItemLayers.value.get(vizId);
			if (!layer) continue; // Skip if no layer found for this vizId

			// Collect ds IDs
			removedDsIds.push(...layer.dataSourceIds);

			// Remove layer from the actual map safely
			try {
				if (mapView.value) mapView.value.removeAllFromLayer(layer);
			} catch (error) {
				console.warn(`Error removing layer for vizId ${vizId}:`, error);
			}

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

	/* GEOPTZ */
	watch(
		() => mapStore.selectedGeoPTZ,
		(geoPtz, oldGeoPtz) => {
			// If had value, delete
			if (oldGeoPtz?.length) deleteMapVisualizations([oldGeoPtz[0].id]);
			// If has a new value, create new
			if (geoPtz?.length) addMapVisualizationLayer(geoPtz[0]);
		},
		{ deep: true }
	);

	/** MAP INTERACTIONS */
	let cleanupClickHandler: (() => void) | null = null;
	watch(mapView, (map) => {
		if (!map) return;
		console.log('Heyyy');

		if (cleanupClickHandler) {
			cleanupClickHandler();
			cleanupClickHandler = null;
		}

		const handleClick: MapClickHandler = (lat: number, lon: number, alt: number) => {
			if (mapStore.isGeoPTZSelected) taskGeoPTZ(lat, lon, alt);
			if (mapStore.selectedWaypoints) mapStore.setCurrentLLA(lat, lon, 0);
			// Add additional onClick functions
		};

		// Handle map click
		if (mapType.value === 'leaflet') {
			handleLeafletClick(map, handleClick)
		} else if (mapType.value === 'cesium') {
			cleanupClickHandler = handleCesiumClick(map, handleClick);
		}
	});

	//TODO: Cursor styling

	onMounted(() => {
		initMap();
	});

	return {
		mapView,
		initMap,
		destroyMap,
		switchMap,
		deleteMapVisualizations,
	};
}

export type MapClickHandler = (lat: number, lon: number, alt: number) => void;
