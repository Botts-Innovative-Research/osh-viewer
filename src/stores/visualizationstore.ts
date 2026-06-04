import { defineStore } from 'pinia';
import { computed, ref, Ref } from 'vue';
import { Geometry, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useDataStreamStore } from '@/stores/datastreamstore';
import {
	rehydrateVisualization,
	SerializedVisualization,
	serializeVisualization,
} from '@/modules/visualization/services/visualization.serialization';

export const useVisualizationStore = defineStore(
	'visualizations',
	() => {
		const visualizations: Ref<OSHVisualization[]> = ref([]);
		const serializedVisualizations: Ref<SerializedVisualization[]> = ref([]);
		const layerVisibility: Ref<Map<string, boolean>> = ref(new Map());

		// Filter only PANEL visualizations
		const panelVisualizations = computed(() => {
			return visualizations.value.filter((v: OSHVisualization) => v.viewLocation === 'panel');
		});

		// Filter only MAP visualizations
		const mapVisualizations = computed(() => {
			return visualizations.value.filter((v: OSHVisualization) => v.viewLocation === 'map');
		});

		const addVisualization = (visualization: OSHVisualization): void => {
			console.log('[VisualizationStore] Adding visualization:', visualization);
			visualizations.value.push(visualization);

			// TODO: Remove for foi patch
			if (visualization.type === 'pointmarker-feature') {
				console.log('skipping fois for serialization');
				return;
			}
			serializedVisualizations.value.push(serializeVisualization(visualization));
		};

		const removeVisualization = (visualization: OSHVisualization): void => {
			visualizations.value = visualizations.value.filter((v) => v !== visualization);
			serializedVisualizations.value = serializedVisualizations.value.filter(
				(viz) => viz.id !== visualization.id
			);
		};

		const removeAllVisualizations = (): void => {
			visualizations.value = [];
			serializedVisualizations.value = [];
			console.log('Removed all current visualizations');
		};

		const getVisualizationById = (id: string): OSHVisualization | undefined => {
			return visualizations.value.find((visualization) => visualization.id === id);
		};

		const getVisualizationsByType = (type: string): OSHVisualization[] => {
			return visualizations.value.filter((visualization) => visualization.type === type);
		};

		const toggleMapLayerVisibility = (layerId: string): boolean => {
			const currentVisibility = layerVisibility.value.get(layerId) ?? true;
			layerVisibility.value.set(layerId, !currentVisibility);
			return !currentVisibility;
		};

		const isMapLayerVisible = (layerId: string): boolean => {
			return layerVisibility.value.get(layerId) ?? true;
		};

		const clearMapLayerVisibility = () => {
			layerVisibility.value.clear();
		};

		const rehydrateVisualizations = (): void => {
			if (serializedVisualizations.value.length === 0 || visualizations.value.length > 0)
				return;

			if (useDataStreamStore().dataStreams.length === 0) {
				console.warn('[VizStore] Datastreams not ready, skipping rehydrate');
				return;
			}

			for (const serialized of serializedVisualizations.value) {
				visualizations.value.push(rehydrateVisualization(serialized));
			}
			console.log('[VizStore] Rehydrated visualizations:', visualizations.value.length);
		};

		/* FOI PATCH */
		const foiLayers: Ref<Geometry[]> = ref<Geometry[]>([]);
		const addFOILayer = (geometry: Geometry) => {
			foiLayers.value.push(geometry);
		};
		const clearFOILayers = () => {
			foiLayers.value = [];
		};

		return {
			visualizations,
			serializedVisualizations,
			panelVisualizations,
			mapVisualizations,
			addVisualization,
			removeVisualization,
			removeAllVisualizations,
			getVisualizationById,
			getVisualizationsByType,
			toggleMapLayerVisibility,
			isMapLayerVisible,
			clearMapLayerVisibility,
			layerVisibility,
			rehydrateVisualizations,
			foiLayers,
			addFOILayer,
			clearFOILayers,
		};
	},
	{ persist: { pick: ['serializedVisualizations'] } }
);
