import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { PolylineDescriptor } from './Descriptor';
import { VisualizationComponents } from '../../types/visualization';
import { IPolylineCustomizationOptions } from '../../types/customization';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { IPolylineLayerProperties } from '../../types/layers';

export default function build() {
	console.log('Building Polyline Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const pmResult = CreatePolylineVizProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.polylineLayer,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'polyline',
		PolylineDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Polyline Visualization:', newViz);
}

/**
 * Creates properties for a Polyline based on the provided datastream, selected property, and visualization options.
 * @param datastreams
 * @param visOptions
 * @constructor
 */
export function CreatePolylineVizProps(
	datastreams: { [key: string]: any },
	visOptions: IPolylineCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: IConSysApiDataSourceProperties[] = [];
	let polylineLayer: IPolylineLayerProperties = {
		name: visOptions.name,
		color: visOptions.color,
		weight: visOptions.weight,
		opacity: visOptions.opacity,
		iconName: 'vector-polyline', // For map visualizations list icon
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
		polylineLayer,
	};
}
