import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {useDataStreamStore} from "@/stores/datastreamstore";
import {useControlStreamStore} from "@/stores/controlstreamstore";

export interface SerializeVisualization {
    id: string;
    name: string;
    type: string;
    parentId: string | null;
    datastreamIds: string[],
    controlstreamIds: string[],
    visualizationComponents: any
}
export const useVisualizationStore = defineStore('visualizations',
    () => {
	const visualizations: Ref<OSHVisualization[]> = ref([]);
	const serializedVisualizations: Ref<SerializeVisualization[]> = ref([]);
	const currentVisDataStreamOptions: Ref<any> = ref({});
	const currentVisualizationCustomizationOptions: Ref<any> = ref({});

	const addVisualization = (visualization: OSHVisualization): void => {
		console.log('[VisualizationStore] Adding visualization:', visualization);
		visualizations.value.push(visualization);

        const getIds = (stream: any): string[] => {
            return stream != null ? Object.keys(stream) : [];
        }

        if (visualization.type === 'pointmarker-feature') {
            console.log("skipping fois for serialization")
            return;
        }
        serializedVisualizations.value.push({
            id: visualization.id,
            name: visualization.name,
            type: visualization.type,
            parentId: visualization.parentId,
            datastreamIds: getIds(visualization.parentDatastream),
            controlstreamIds: getIds(visualization.controlstream),
            visualizationComponents: visualization.visualizationComponents
        });
	};

	const removeVisualization = (visualization: OSHVisualization): void => {
		visualizations.value = visualizations.value.filter((v) => v !== visualization);

        serializedVisualizations.value = serializedVisualizations.value.filter((viz) => viz.id !== visualization.id)
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
	};

	const clearCurrentVisualizationCustomizationOptions = (): void => {
		console.log('[VisualizationStore] Clearing current visualization customization options');
		currentVisualizationCustomizationOptions.value = {};
	};

    const rehydrateVisualizations = (): void => {
        if (serializedVisualizations.value.length === 0 || visualizations.value.length > 0) return;

        const datastreamStore = useDataStreamStore();
        const controlstreamStore = useControlStreamStore();

        for (const serialized of serializedVisualizations.value) {

            if (datastreamStore.dataStreams.length === 0) {
                console.warn('[VizStore] Datastreams not ready, skipping rehydrate');
                return;
            }

            const datastreams = datastreamStore.getDataStreamsById(serialized.datastreamIds)
            const controlstreams = controlstreamStore.getControlStreamsById(serialized.controlstreamIds);

            const visualization = new OSHVisualization(
                serialized.id,
                serialized.name,
                serialized.type,
                serialized.parentId,
                datastreams,
                controlstreams
            )

            visualization.setVisualizationComponents(serialized.visualizationComponents);
            visualizations.value.push(visualization);
        }
        console.log('[VizStore] Rehydrated visualizations:', visualizations.value.length);
    }
	return {
		visualizations,
        serializedVisualizations,
		addVisualization,
		removeVisualization,
		getVisualizationById,
		getVisualizationsByType,
		currentVisDataStreamOptions,
		updateCurrentVisDataStreamOptions,
		clearCurrentVisDataStreamOptions,
		currentVisualizationCustomizationOptions,
		updateCurrentVisualizationCustomizationOptions,
		clearCurrentVisualizationCustomizationOptions,
        rehydrateVisualizations
	};
}, { persist: { pick: ['serializedVisualizations'] } });
