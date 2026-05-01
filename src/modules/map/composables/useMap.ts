import { useMapStore } from '@/stores/mapstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed, onMounted, ref, watch } from 'vue';
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';
import PointMarkerLayer from 'osh-js/source/core/ui/layer/PointMarkerLayer';
import LoBLayer from 'osh-js/source/core/ui/layer/viewer/LoB.js';
import { createMapVisualizations, deleteMapVisualizations } from '../mapVisualizations';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';

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

	async function initMap() {
		if (mapType.value === 'leaflet') {
			mapView.value = new LeafletView({
				container: 'mapContainer',
				layers: [],
				autoZoomOnFirstMarker: true,
			});
		} else {
			mapView.value = new CesiumView({
				container: 'mapContainer',
				autoZoomOnFirstMarker: true,
				layers: [],
			});

			// Wait for Cesium to be fully ready
			await new Promise(requestAnimationFrame);
		}
	}

	async function destroyMap() {
		if (!mapView.value) return;
		mapView.value.destroy();
		mapView.value = null;
	}

	async function switchMap() {
		await destroyMap();
		await initMap();
	}

	onMounted(() => {
		initMap();
	});

	watch(mapType, async () => {
		await switchMap();
	});

	/* CREATE/DELETE VISUALIZATIONS */
	watch(
		() => visualizationStore.mapVisualizations.map((v) => v.id),
		(newIds, oldIds) => {
			// Handle removed visualizations
			const removedIds = oldIds?.filter((oldId) => !newIds.some((id) => id === oldId));
			if (removedIds) deleteMapVisualizations(removedIds);
			// TODO: Handle removing viz from mapItemLayers

			//Handle added visualizations
			const addedIds = newIds?.filter((newId) => !oldIds?.some((id) => id === newId));
			if (addedIds) {
				const newOSHVisualizations: OSHVisualization[] = addedIds
					.map((id) => visualizationStore.getVisualizationById(id))
					.filter(Boolean) as OSHVisualization[];

				for (const viz of newOSHVisualizations) {
					const result = createMapVisualizations(viz);
          if (result) {
            const { vizLayer, dsInstances } = result;
            console.log(`Created ${viz.type} Visualization:`, vizLayer);
            listDataSourceInstances.value.push(...dsInstances); // Push dsInstances to list of all active ds
            mapItemLayers.value.set(viz.id, vizLayer);  // Store vizLayer instance for this viz.id
            mapView.value.addLayer(vizLayer); // Add vizLayer to map
          }
				}
			}
		},
		{ immediate: true, deep: true }
	);

	return {
		mapView,
		initMap,
		destroyMap,
		switchMap,
	};
}
