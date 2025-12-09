import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';

export const useVisualizationStore = defineStore('visualizations', () => {
	const visualizations: Ref<OSHVisualization[]> = ref([]);
	const currentVisDataStreamOptions: Ref<any> = ref({});
	const currentVisualizationCustomizationOptions: Ref<any> = ref({});

	const addVisualization = (visualization: OSHVisualization): void => {
		console.log('[VisualizationStore] Adding visualization:', visualization);
		visualizations.value.push(visualization);
	};

	const removeVisualization = (visualization: OSHVisualization): void => {
		visualizations.value = visualizations.value.filter((v) => v !== visualization);
	};

	const getVisualizationById = (id: string): OSHVisualization | undefined => {
		return visualizations.value.find((visualization) => visualization.id === id);
	};

	const getVisualizationsByType = (type: string): OSHVisualization[] => {
		return visualizations.value.filter((visualization) => visualization.type === type);
	};

	const updateCurrentVisDataStreamOptions = (options: any): void => {
		console.log(
			'[VisualizationStore] Updating current visualization data stream options:',
			options
		);
		currentVisDataStreamOptions.value = {
			...currentVisDataStreamOptions.value,
			...options,
		};
	};

	const clearCurrentVisDataStreamOptions = (): void => {
		console.log('[VisualizationStore] Clearing current visualization data stream options');
		currentVisDataStreamOptions.value = {};
	};

	const updateCurrentVisualizationCustomizationOptions = (options: any): void => {
		console.log(
			'[VisualizationStore] Updating current visualization customization options:',
			options
		);
		currentVisualizationCustomizationOptions.value = {
			...currentVisualizationCustomizationOptions.value,
			...options,
		};
	}

	const clearCurrentVisualizationCustomizationOptions = (): void => {
		console.log('[VisualizationStore] Clearing current visualization customization options');
		currentVisualizationCustomizationOptions.value = {};
	};

	return {
		visualizations,
		addVisualization,
		removeVisualization,
		getVisualizationById,
		getVisualizationsByType,
		currentVisDataStreamOptions,
		updateCurrentVisDataStreamOptions,
		clearCurrentVisDataStreamOptions,
		currentVisualizationCustomizationOptions,
		updateCurrentVisualizationCustomizationOptions,
		clearCurrentVisualizationCustomizationOptions
	};
});
