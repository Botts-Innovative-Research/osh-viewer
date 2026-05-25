import { defineStore } from 'pinia';
import { computed, ref, Ref } from 'vue';
import {
	Geometry,
	OSHControlStream,
	OSHDatastream,
	OSHVisualization,
} from '@/lib/OSHConnectDataStructs';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { ViewLocation } from '@/modules/visualization/registry/types';
import { WizardConfig } from './vizwizstore';

export interface SerializeVisualization {
	id: string;
	name: string;
	type: string;
	parentId: string | null;
	datastreamIds: string[];
	controlstreamIds: string[];
	visualizationComponents: any;
	viewLocation: ViewLocation;
	wizardConfig: WizardConfig;
	children: SerializeVisualization[] | [];
}

export const useVisualizationStore = defineStore(
	'visualizations',
	() => {
		const visualizations: Ref<OSHVisualization[]> = ref([]);
		const serializedVisualizations: Ref<SerializeVisualization[]> = ref([]);
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

		const rehydrateVisualizations = (): void => {
			if (serializedVisualizations.value.length === 0 || visualizations.value.length > 0)
				return;

			const datastreamStore = useDataStreamStore();

			if (datastreamStore.dataStreams.length === 0) {
				console.warn('[VizStore] Datastreams not ready, skipping rehydrate');
				return;
			}

			for (const serialized of serializedVisualizations.value) {
				const visualization = deserializeVisualization(serialized);
				visualizations.value.push(visualization);
			}
			console.log('[VizStore] Rehydrated visualizations:', visualizations.value.length);
		};

		/* SERIALIZATION */
		const serializeVisualization = (
			visualization: OSHVisualization
		): SerializeVisualization => {
			let serialized: SerializeVisualization = {
				id: visualization.id,
				name: visualization.name,
				type: visualization.type,
				parentId: visualization.parentId ?? null,
				datastreamIds: getIds(visualization.datastream),
				controlstreamIds: visualization.controlstream
					? getIds(visualization.controlstream)
					: [],
				visualizationComponents: visualization.visualizationComponents,
				viewLocation: visualization.viewLocation,
				wizardConfig: visualization.wizardConfig,
				children: [],
			};

			if (visualization.children) {
				let serializedChildren: SerializeVisualization[] = [];
				visualization.children.forEach((viz: OSHVisualization) => {
					serializedChildren.push(serializeVisualization(viz));
				});
				serialized.children = serializedChildren;
			}

			return serialized;
		};

		const deserializeVisualization = (serialized: SerializeVisualization): OSHVisualization => {
			const datastreamStore = useDataStreamStore();
			const controlstreamStore = useControlStreamStore();

			const datastreams = datastreamStore.getDataStreamsById(serialized.datastreamIds);
			const controlstreams = controlstreamStore.getControlStreamsById(
				serialized.controlstreamIds
			);

			const visualization = new OSHVisualization(
				serialized.id,
				serialized.name,
				serialized.type,
				serialized.viewLocation,
				datastreams,
				controlstreams,
				serialized.parentId
			);
			visualization.setVisualizationComponents(serialized.visualizationComponents);
			visualization.setWizardConfig(serialized.wizardConfig);

			if (serialized.children) {
				serialized.children.forEach((viz: SerializeVisualization) => {
					visualization.addChildVisualization([deserializeVisualization(viz)]);
				});
			}

			return visualization;
		};

		const getIds = (streams: OSHDatastream[] | OSHControlStream[] | null): string[] => {
			return streams != null
				? streams.map((item: OSHDatastream | OSHControlStream) => item.id)
				: [];
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
			layerVisibility,
			rehydrateVisualizations,
			foiLayers,
			addFOILayer,
			clearFOILayers,
		};
	},
	{ persist: { pick: ['serializedVisualizations'] } }
);
