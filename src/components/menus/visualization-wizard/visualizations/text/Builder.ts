import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import {
	DataLayerProperties,
	ISweApiDataSourceProperties,
	VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../shared/helpers';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { TextDescriptor } from './Descriptor';

export default function build() {
	console.log('Building Text Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams();

	const textResult = CreateTextViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: textResult.vizDatasources,
		dataLayer: textResult.dataLayer,
		dataView: null,
	};

	const newViz = new OSHVisualization(
		`visualization-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name,
		'text',
		TextDescriptor.viewLocation,
		getUsedDatastreams(),
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created Text Visualization:', newViz);
}

export function CreateTextViewProps(datastreams: { [key: string]: any }, visOptions: any) {
	const datastreamStore = useDataStreamStore();

	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let dataLayer: DataLayerProperties = {
		name: visOptions.name
	};

	// Iterate through each unique datastream ID
	for (const [dsId, entry] of Object.entries(datastreams)) {
		// Get selected properties for each role of the datastream
		const properties = BuildRoleProperty(entry);

		// Push new ISweApiDataSourceProperties
		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);
		const currentDataSource: ISweApiDataSourceProperties = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: randomUUID(),
			properties: properties,
			connectorOpts: {
				username:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password,
			},
		};
		vizDatasources.push(currentDataSource);
	}

	console.log('Created Text View Props:', {vizDatasources, dataLayer});

	return {
		vizDatasources,
		dataLayer,
	};
}
