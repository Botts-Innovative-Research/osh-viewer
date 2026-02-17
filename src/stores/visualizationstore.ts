import { defineStore } from 'pinia';
import { computed, ref, Ref } from 'vue';
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

export const PANEL_VISUALIZATIONS = [
    'chart',
    'video',
    'text',
    'mission',
]

export const MAP_VISUALIZATIONS = [
    'pointmarker',  // NEW value for old pmorientation
    'lob',
]

export const useVisualizationStore = defineStore('visualizations',
    () => {
	const visualizations: Ref<OSHVisualization[]> = ref([]);
	const serializedVisualizations: Ref<SerializeVisualization[]> = ref([]);
	const currentVisDataStreamOptions: Ref<any> = ref({});
	const currentVisualizationCustomizationOptions: Ref<any> = ref({});
    const layerVisibility: Ref<Map<string, boolean>> = ref(new Map());

    // Filter only PANEL visualizations
    const panelVisualizations = computed(() => {
        return visualizations.value.filter((v: OSHVisualization) =>
            PANEL_VISUALIZATIONS.includes(v.type)
        )
    })

    // Filter only MAP visualizations
    const mapVisualizations = computed(() => {
        return visualizations.value.filter((v: OSHVisualization) =>
            MAP_VISUALIZATIONS.includes(v.type)
        )
    })

	const addVisualization = (visualization: OSHVisualization): void => {
		console.log('[VisualizationStore] Adding visualization:', visualization);
		visualizations.value.push(visualization);

        const getIds = (streams: OSHDatastream[] | OSHControlStream[] | null): string[] => {
            return streams != null ? streams.map((item: OSHDatastream | OSHControlStream) => item.id) : [];
        }

        if (visualization.type === 'pointmarker-feature') {
            console.log("skipping fois for serialization")
            return;
        }
        serializedVisualizations.value.push({
            id: visualization.id,
            name: visualization.name,
            type: visualization.type,
            parentId: visualization.parentId ?? null,
            datastreamIds: getIds(visualization.datastream),
            controlstreamIds: visualization.controlstream ? getIds(visualization.controlstream) : [],
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

    const toggleMapLayerVisibility = (layerId: string): boolean => {
        const currentVisibility = layerVisibility.value.get(layerId) ?? true;
        layerVisibility.value.set(layerId, !currentVisibility);
        return !currentVisibility;
    };

    const isMapLayerVisible = (layerId: string): boolean => {
        return layerVisibility.value.get(layerId) ?? true;
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

            const datastreams = datastreamStore.getDataStreamsById(serialized.datastreamIds);
            const controlstreams = controlstreamStore.getControlStreamsById(serialized.controlstreamIds);

            const visualization = new OSHVisualization(
                serialized.id,
                serialized.name,
                serialized.type,
                serialized.parentId,
                datastreams,
                controlstreams,
                serialized.parentId,
            )

            visualization.setVisualizationComponents(serialized.visualizationComponents);
            visualizations.value.push(visualization);
        }
        console.log('[VizStore] Rehydrated visualizations:', visualizations.value.length);
    }

	return {
		visualizations,
        serializedVisualizations,
        panelVisualizations,
        mapVisualizations,
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
		toggleMapLayerVisibility,
        isMapLayerVisible,
        layerVisibility,
        rehydrateVisualizations,
	};
}, { persist: { pick: ['serializedVisualizations'] } });
