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

		/* FOI Layers */
		const foiLayers: Ref<FoiLayer[]> = ref<FoiLayer[]>([]);
		const addFOILayer = (geometry: Geometry) => {
			foiLayers.value = [
				...foiLayers.value,
				{ geometry, icon: '/icons/map/map-marker.png', color: '#FFFFFF' },
			];
		};
		const editFOIIcon = (systemId: string, icon: string) => {
			foiLayers.value = foiLayers.value.map((foi) =>
				foi.geometry.systemId === systemId ? { ...foi, icon } : foi
			);
		};
		const editFOIColor = (systemId: string, color: string) => {
			foiLayers.value = foiLayers.value.map((foi) =>
				foi.geometry.systemId === systemId ? { ...foi, color } : foi
			);
		};
		const removeFOILayer = (systemId: string) => {
			foiLayers.value = foiLayers.value.filter((foi) => {
				return foi.geometry.systemId !== systemId;
			});
		};
		const clearFOILayers = () => {
			foiLayers.value = [];
		};
		const FOIExists = (systemId: string) => {
			return foiLayers.value.some((foi) => foi.geometry.systemId === systemId);
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
			editFOIIcon,
			editFOIColor,
			removeFOILayer,
			clearFOILayers,
			FOIExists,
		};
	},
	{ persist: { pick: ['serializedVisualizations'] } }
);

/**
 * Metadata of FOI geometry and customization properties
 *
 * geometry - Geometry type
 * icon - icon path
 * color - icon color
 */
export interface FoiLayer {
	geometry: Geometry;
	icon: string;
	color: string;
}
