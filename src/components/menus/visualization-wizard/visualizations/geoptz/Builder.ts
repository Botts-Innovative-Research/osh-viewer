import { OSHControlStream, OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiControlStreamProperties, ISweApiDataSourceProperties, VisualizationComponents } from '@/lib/VisualizationHelpers';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { AggregateControlstreams, BuildRoleProperty, getUsedControlstreams } from '../../shared/helpers';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { ChartDescriptor } from '../chart/Descriptor';
import { GeoPtzDescriptor } from './Descriptor';

export default function build() {
	console.log('Building GeoPTZ Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = vizwizStore.datastreams;
	const controlstreams = AggregateControlstreams();

	const geoPtzResult = CreateGeoPtzViewProps(
		datastreams[0],
		controlstreams,
		vizwizStore.visualizationCustomizationOptions
	);

	const visualizationComponents: VisualizationComponents = {
		dataSource: geoPtzResult.vizDatasources,
		dataLayer: null,
		dataView: null,
		controlstream: geoPtzResult.vizControlstreams
	};

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name,
		'geoPtz',
		GeoPtzDescriptor.viewLocation,
		datastreams,
		getUsedControlstreams()
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created GeoPTZ Visualization:', newViz);
}

export function CreateGeoPtzViewProps(datastream: OSHDatastream, controlstreams: { [key: string]: any }, visOptions: any) {
	const controlstreamStore = useControlStreamStore();

	const vizControlstreams: ISweApiControlStreamProperties[] = [];

	// Push new ISweApiDataSourceProperties
	const currentDataSource: ISweApiDataSourceProperties = {
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
			password: datastream.datastream.networkProperties.connectorOpts.password
		},
	};

	// Iterate through each unique controlstream ID
	for (const [csId, entry] of Object.entries(controlstreams)) {
		// Get selected properties for each role of the controlstream
		const properties = BuildRoleProperty(entry);

		// Push new ISweApiDataSourceProperties
		const currentOSHControlstream: OSHControlStream = controlstreamStore.getControlStreamsById([csId])[0];
		const currentControlstream: ISweApiControlStreamProperties = {
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
				username: currentOSHControlstream.controlstream.networkProperties.connectorOpts.username,
				password: currentOSHControlstream.controlstream.networkProperties.connectorOpts.password
			}
		};
		vizControlstreams.push(currentControlstream);
	}
	
	return {
		vizDatasources: [currentDataSource],
		vizControlstreams: vizControlstreams
	};
}
