import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { FrustumDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { IFrustumCustomizationOptions } from '../../types/customization';
import { IFrustumLayerProperties } from '../../types/layers';

export default function build() {
	console.log('Building Point Marker Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const frustumResult = CreateFrustumVizProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: frustumResult.vizDatasources,
		dataLayer: frustumResult.frustumLayer,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'frustum',
		FrustumDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Frustum Visualization:', newViz);
}

export function CreateFrustumVizProps(
	datastreams: { [key: string]: any },
	visOptions: IFrustumCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: IConSysApiDataSourceProperties[] = [];
	let frustumLayer: IFrustumLayerProperties = {
		name: visOptions.name,
		color: visOptions.color || '#FF0000',
		opacity: visOptions.opacity,
		iconName: 'pyramid',
	};

	// Iterate through each unique datastream ID
	for (const [dsId, entry] of Object.entries(datastreams)) {
		// Get selected properties for each role of the datastream
		const properties = BuildRoleProperty(entry);

		// Push new IConSysApiDataSourceProperties
		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);
		const currentDataSource: IConSysApiDataSourceProperties = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: dsId,
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

	return {
		vizDatasources,
		frustumLayer,
	};
}
