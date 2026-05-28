import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
	IMapViewProperties,
	IPolylineCustomizationOptions,
	IPolylineLayerProperties,
	ISweApiDataSourceProperties,
	VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { PolylineDescriptor } from './Descriptor';

export default function build() {
	console.log('Building Polyline Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const pmResult = CreatePolylineViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.polylineLayer,
		dataView: pmResult.mapView,
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
export function CreatePolylineViewProps(
	datastreams: { [key: string]: any },
	visOptions: IPolylineCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let polylineLayer: IPolylineLayerProperties = {
		name: visOptions.name,
		color: visOptions.color,
		weight: visOptions.weight,
		opacity: visOptions.opacity,
		iconName: 'vector-polyline', // For map visualizations list icon
	};
	let mapView: IMapViewProperties = {
		container: `map-container-${randomUUID()}`,
		css: 'map-view',
		layers: [polylineLayer],
		refreshRate: 1000,
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

	console.log('Created Polyline Props:', { vizDatasources, polylineLayer, mapView });

	return {
		vizDatasources,
		polylineLayer,
		mapView,
	};
}
