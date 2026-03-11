import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import {
	ISweApiDataSourceProperties,
	VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { KerbyRfDescriptor } from './Descriptor';

export default function build() {
	console.log('Building Kerby RF Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();
	const datastreamStore = useDataStreamStore();
	const controlstreamStore = useControlStreamStore();

	// Get the selected datastream from Config step
	const streamConfig = vizwizStore.dsConfig.stream;
	if (!streamConfig?.dsId) {
		throw new Error('No datastream selected. Please select a Kerby datastream in the Configure step.');
	}

	// Find the selected datastream in the global store
	const selectedDs = datastreamStore.getDataStreamsById([streamConfig.dsId]);
	if (selectedDs.length === 0) {
		throw new Error(`Datastream ${streamConfig.dsId} not found in store.`);
	}

	const primaryDs = selectedDs[0];
	const parentSystemId = primaryDs.parentId;

	if (!parentSystemId) {
		throw new Error('Selected datastream has no parent system.');
	}

	// Auto-discover ALL datastreams and controlstreams from the same system
	const allSystemDatastreams = datastreamStore.getDataStreamsBySystemId([parentSystemId]);
	const allSystemControlstreams = controlstreamStore.getControlStreamsBySystemId([parentSystemId]);

	console.log(`Auto-discovered ${allSystemDatastreams.length} datastream(s) and ${allSystemControlstreams.length} controlstream(s) for system ${parentSystemId}`);

	// Build a primary datasource from the selected datastream
	const net = primaryDs.datastream?.networkProperties;
	if (!net) {
		throw new Error('Selected datastream has no network properties.');
	}

	const primaryDatasource: ISweApiDataSourceProperties = {
		endpointUrl: net.endpointUrl,
		resource: `/datastreams/${primaryDs.id}/observations`,
		tls: net.tls,
		protocol: 'ws',
		startTime: 'now',
		endTime: '2125-08-01T00:00:00Z',
		mode: Mode.REAL_TIME,
		responseFormat: 'application/swe+json',
		id: randomUUID(),
		properties: { stream: { property: '*', outputName: primaryDs.datastream?.properties?.outputName ?? 'result' } },
		connectorOpts: {
			username: net.connectorOpts?.username ?? '',
			password: net.connectorOpts?.password ?? '',
		},
	};

	const visualizationComponents: VisualizationComponents = {
		dataSource: [primaryDatasource],
		dataLayer: { name: vizwizStore.visualizationCustomizationOptions.name },
		dataView: null,
	};

	// Create visualization with ALL system datastreams and controlstreams
	// KerbyRf.vue will auto-connect to each one via visualization.datastream
	const newViz = new OSHVisualization(
		`visualization-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name || 'Kerby RF',
		'kerby-rf',
		KerbyRfDescriptor.viewLocation,
		allSystemDatastreams,
		allSystemControlstreams,
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created Kerby RF Visualization:', newViz);
}
