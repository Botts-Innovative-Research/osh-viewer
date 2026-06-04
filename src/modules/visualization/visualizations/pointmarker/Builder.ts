import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { PointMarkerDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import { IPointMarkerCustomizationOptions } from '../../types/customization';
import { ISweApiDataSourceProperties } from '../../types/datasource';
import { IPointMarkerLayerProperties } from '../../types/layers';

export default function build() {
	console.log('Building Point Marker Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const pmResult = CreatePointMarkerViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.pointMarkerLayer,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'pointmarker',
		PointMarkerDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Point Marker Visualization:', newViz);
}

/**
 * Creates properties for a Map View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedProperty
 * @param visOptions
 * @constructor
 */
export function CreatePointMarkerViewProps(
	datastreams: { [key: string]: any },
	visOptions: IPointMarkerCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let pointMarkerLayer: IPointMarkerLayerProperties = {
		name: visOptions.name,
		label: visOptions.name,
		icon: visOptions.icon,
		iconColor: visOptions.iconColor || '#FF0000',
		iconName: visOptions.iconName,
		iconSize: [32, 32],
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

	console.log('Created PointMarkerViewProps:', { vizDatasources, pointMarkerLayer });

	return {
		vizDatasources,
		pointMarkerLayer,
	};
}
