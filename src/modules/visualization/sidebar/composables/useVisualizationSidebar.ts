import { OSHVisualization } from '@/lib/OSHConnectDataStructs';

import { useMapStore } from '@/stores/mapstore';
import { useUIStore } from '@/stores/uistore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { VisualizationLayerProperties } from '../../types/visualization';
import { SupportedMapLayer } from '@/modules/map/supportedMapLayers';

export function useVisualizationSidebar() {
	// Stores
	const uiStore = useUIStore();
	const mapStore = useMapStore();
	const visualizationStore = useVisualizationStore();
	const { visualizations } = storeToRefs(visualizationStore);

	// States
	const editViz = ref<OSHVisualization | undefined>();
	const selectedGeoPTZControllers = ref<OSHVisualization[]>([]);

	// Sorted visualizations
	const panelVisualizations = computed<OSHVisualization[]>(() =>
		visualizations.value.filter(
			(viz) =>
				viz.viewLocation === 'panel' ||
				// Filter out geoPtz viz type from "multi" viewLocation visualizations
				(viz.viewLocation === 'multi' && viz.type !== 'geoPtz')
		)
	);
	const mapVisualizations = computed<OSHVisualization[]>(() =>
		visualizations.value.filter((viz) => viz.viewLocation === 'map')
	);
	const geoPtzVisualizations = computed<OSHVisualization[]>(() =>
		visualizations.value.filter((viz) => viz.type === 'geoPtz')
	);

	/* Panel state */
	const openPanels = ref<string[]>([]);
	function handleOpenPanels() {
		if (mapVisualizations.value.length) {
			if (!openPanels.value.includes('map')) openPanels.value.push('map');
		} else {
			openPanels.value = openPanels.value.filter((id: string) => id !== 'map');
		}

		if (geoPtzVisualizations.value.length) {
			if (!openPanels.value.includes('geoptz')) openPanels.value.push('geoptz');
		} else {
			openPanels.value = openPanels.value.filter((id: string) => id !== 'geoptz');
		}
	}
	watch([() => mapVisualizations.value, () => geoPtzVisualizations.value], () => {
		handleOpenPanels();
	});

	/* GEOPTZ HELPERS */
	function removeGeoPTZ(controller: OSHVisualization) {
		visualizationStore.removeVisualization(controller); // Remove from visualization store
		selectedGeoPTZControllers.value = selectedGeoPTZControllers.value.filter(
			(item: OSHVisualization) => item.id !== controller.id
		); // Remove from selected list
	}

	/* MAP HELPERS */
	function isMapLayer(
		layer: VisualizationLayerProperties | VisualizationLayerProperties[] | null
	): layer is SupportedMapLayer {
		return !!layer && 'iconName' in layer;
	}
	function isMapLayerVisible(id: string): boolean {
		return visualizationStore.isMapLayerVisible(id);
	}
	function toggleMapLayerVisibility(item: any) {
		visualizationStore.toggleMapLayerVisibility(item.id);
	}
	function toggleSelectedMapItem(item: any) {
		if (mapStore.selectedMapItem && mapStore.selectedMapItem.id === item.id) {
			mapStore.setSelectedMapItem(null);
		} else {
			mapStore.setSelectedMapItem(item);
		}
	}

	/* VISUALIZATIONS */
	function removeVisualization(viz: OSHVisualization) {
		visualizationStore.removeVisualization(viz);
	}

	/* VISUALIZATION WIZARD */
	function openEditViz(viz: OSHVisualization | string) {
		if (typeof viz === 'string') editViz.value = visualizationStore.getVisualizationById(viz);
		else editViz.value = viz;
		uiStore.openEditViz();
	}

	onMounted(() => {
		handleOpenPanels();
	});

	return {
		editViz,
		panelVisualizations,
		mapVisualizations,
		geoPtzVisualizations,
		openPanels,
		selectedGeoPTZControllers,
		removeGeoPTZ,
		isMapLayer,
		isMapLayerVisible,
		toggleMapLayerVisibility,
		toggleSelectedMapItem,
		removeVisualization,
		openEditViz,
	};
}
