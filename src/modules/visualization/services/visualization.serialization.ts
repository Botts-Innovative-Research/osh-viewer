import { OSHControlStream, OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ViewLocation } from '../registry/types';
import { WizardConfig } from '@/stores/vizwizstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { VisualizationComponents } from '../types/visualization';

export interface SerializedVisualization {
	id: string;
	name: string;
	type: string;
	viewLocation: ViewLocation;
	parentId: string | undefined;
	datastreamIds: string[];
	controlstreamIds: string[];
	visualizationComponents: VisualizationComponents | VisualizationComponents[];
	wizardConfig: WizardConfig | null;
	children: SerializedVisualization[];
}

export function serializeVisualization(visualization: OSHVisualization): SerializedVisualization {
	return {
		id: visualization.id,
		name: visualization.name,
		type: visualization.type,
		viewLocation: visualization.viewLocation,
		parentId: visualization.parentId,
		datastreamIds: getStreamIds(visualization.datastream),
		controlstreamIds: getStreamIds(visualization.controlstream ?? null),
		visualizationComponents: visualization.visualizationComponents,
		wizardConfig: visualization.wizardConfig,
		children: visualization.children.map(serializeVisualization),
	};
}

export function rehydrateVisualization(serialized: SerializedVisualization): OSHVisualization {
	const viz = new OSHVisualization(
		serialized.id,
		serialized.name,
		serialized.type,
		serialized.viewLocation,
		rehydrateDatastreams(serialized.datastreamIds),
		rehydrateControlStreams(serialized.controlstreamIds),
		serialized.parentId
	);
	viz.visualizationComponents = serialized.visualizationComponents;
	viz.wizardConfig = serialized.wizardConfig;
	viz.children = (serialized.children ?? []).map(rehydrateVisualization);
	return viz;
}

export function getStreamIds(streams: OSHDatastream[] | OSHControlStream[] | null): string[] {
	if (!streams) return [];
	return streams.map((stream) => stream.id);
}

export function rehydrateDatastreams(ids: string[]): OSHDatastream[] {
	const datastreamStore = useDataStreamStore();
	return datastreamStore.getDataStreamsById(ids);
}

export function rehydrateControlStreams(ids: string[]): OSHControlStream[] {
	const controlStreamStore = useControlStreamStore();
	return controlStreamStore.getControlStreamsById(ids);
}
