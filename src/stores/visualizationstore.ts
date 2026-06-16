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
		const hiddenLayers: Ref<Set<string>> = ref(new Set());

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
			visualizations.value = visualizations.value.filter(
				(viz) => viz.id !== visualization.id && viz.parentId !== visualization.id
			);
			serializedVisualizations.value = serializedVisualizations.value.filter(
				(viz) => viz.id !== visualization.id && viz.parentId !== visualization.id
			);
		};

		const removeAllVisualizations = (): void => {
			visualizations.value = [];
			serializedVisualizations.value = [];
			console.log('Removed all current visualizations');
		};

		const getVisualizationById = (id: string): OSHVisualization | undefined => {
			for (const visualization of visualizations.value) {
				if (visualization.id === id) return visualization;

				const child = visualization.children.find((child) => child.id === id);
				if (child) return child;
			}

			return undefined;
		};

		const getVisualizationsByType = (type: string): OSHVisualization[] => {
			return visualizations.value.filter((visualization) => visualization.type === type);
		};

		const toggleMapLayerVisibility = (id: string): boolean => {
			if (hiddenLayers.value.has(id)) {
				hiddenLayers.value.delete(id);
			} else {
				hiddenLayers.value.add(id);
			}

			return hiddenLayers.value.has(id);
		};

		const isMapLayerVisible = (id: string): boolean => {
			return !hiddenLayers.value.has(id);
		};

		const clearMapLayerVisibility = () => {
			hiddenLayers.value = new Set();
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
			hiddenLayers,
			rehydrateVisualizations,
			foiLayers,
			addFOILayer,
			clearFOILayers,
		};
	},
	{ persist: { pick: ['serializedVisualizations'] } }
);
