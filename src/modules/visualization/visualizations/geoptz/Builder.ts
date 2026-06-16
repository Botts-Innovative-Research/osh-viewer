import { OSHControlStream, OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { GeoPtzDescriptor } from './Descriptor';
import {
	AggregateControlstreams,
	BuildRoleProperty,
	getUsedControlstreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import {
	IConSysApiControlStreamProperties,
	IConSysApiDataSourceProperties,
} from '../../types/datasource';

export default function build() {
	console.log('Building GeoPTZ Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = vizwizStore.datastreams;
	const controlstreams = AggregateControlstreams(vizwizStore.csConfig);

	const geoPtzResult = CreateGeoPtzVizProps(datastreams[0], controlstreams);

	const visualizationComponents: VisualizationComponents = {
		dataSource: geoPtzResult.vizDatasources,
		dataLayer: [],
		controlstream: geoPtzResult.vizControlstreams,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'geoPtz',
		GeoPtzDescriptor.viewLocation,
		datastreams,
		getUsedControlstreams(vizwizStore.controlstreams, vizwizStore.csConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created GeoPTZ Visualization:', newViz);
}

export function CreateGeoPtzVizProps(
	datastream: OSHDatastream,
	controlstreams: { [key: string]: any }
) {
	const controlstreamStore = useControlStreamStore();

	const vizControlstreams: IConSysApiControlStreamProperties[] = [];

	// Push new IConSysApiDataSourceProperties
	const currentDataSource: IConSysApiDataSourceProperties = {
		endpointUrl: datastream.datastream.networkProperties.endpointUrl,
		resource: `/datastreams/${datastream.id}/observations`,
		tls: datastream.datastream.networkProperties.tls,
		protocol: 'ws',
		startTime: 'now',
		endTime: '2125-08-01T00:00:00Z',
		mode: Mode.REAL_TIME,
		responseFormat: 'application/swe+json',
		id: randomUUID(),
		properties: {},
		connectorOpts: {
			username: datastream.datastream.networkProperties.connectorOpts.username,
			password: datastream.datastream.networkProperties.connectorOpts.password,
		},
	};

	// Iterate through each unique controlstream ID
	for (const [csId, entry] of Object.entries(controlstreams)) {
		// Get selected properties for each role of the controlstream
		const properties = BuildRoleProperty(entry);

		// Push new IConSysApiDataSourceProperties
		const currentOSHControlstream: OSHControlStream = controlstreamStore.getControlStreamsById([
			csId,
		])[0];
		const currentControlstream: IConSysApiControlStreamProperties = {
			endpointUrl: currentOSHControlstream.controlstream.networkProperties.endpointUrl,
			tls: currentOSHControlstream.controlstream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: currentOSHControlstream.id,
			properties: properties,
			connectorOpts: {
				username:
					currentOSHControlstream.controlstream.networkProperties.connectorOpts.username,
				password:
					currentOSHControlstream.controlstream.networkProperties.connectorOpts.password,
			},
		};
		vizControlstreams.push(currentControlstream);
	}

	return {
		vizDatasources: [currentDataSource],
		vizControlstreams: vizControlstreams,
	};
}
