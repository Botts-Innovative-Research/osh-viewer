import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
	IMapLayerProperties,
	IMapViewProperties,
	ISweApiDataSourceProperties,
	VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateDatastreams, BuildRoleProperty } from '../../shared/helpers';

export function build() {
	console.log('Building PM Orientation Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams();
	console.log('Aggregated datastreams for PM Orientation:', datastreams);

	const pmResult = CreateMapViewProps(datastreams, vizwizStore.visualizationCustomizationOptions);
	const visualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.mapLayer,
		dataView: pmResult.mapView,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		'test',
		'pmorientation',
		null,
		datastreams,
		null
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created PM Orientation Visualization:', newViz);
}

/**
 * Creates properties for a Map View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedProperty
 * @param visOptions
 * @constructor
 */
export function CreateMapViewProps(datastreams: { [key: string]: any }, visOptions: any) {
	const datastreamStore = useDataStreamStore();
	console.log('Datastreams: ', datastreamStore.dataStreams);

	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let mapLayer: any = {};

	// Iterate through each unique datastream ID
	for (const [dsId, entry] of Object.entries(datastreams)) {
		console.log('Processing datastream ID:', dsId, 'with entry:', entry);

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
		};
		vizDatasources.push(currentDataSource);
	}

	// Build remaining mapLayer properties
	mapLayer = {
		...mapLayer,
		label: `${randomUUID()} - PM Orientation Layer`,
		icon: visOptions.icon,
		iconSize: [32, 32],
		labelOffset: [-16, -32],
	};

	// Build MapViewProperties
	const mapView: IMapViewProperties = {
		container: `map-container-${randomUUID()}`,
		layers: [mapLayer],
		css: 'map-view',
		refreshRate: 1000,
	};

	console.log('Created MapViewProps:', { vizDatasources, mapLayer, mapView });

	return {
		vizDatasources,
		mapLayer,
		mapView,
	};
}
