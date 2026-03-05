import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
	IMapViewProperties,
	IPointMarkerLayerProperties,
	ISweApiDataSourceProperties,
	VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateDatastreams, BuildRoleProperty, getUsedDatastreams } from '../../shared/helpers';

export default function build() {
	console.log('Building Point Marker Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams();

	const pmResult = CreateMapViewProps(datastreams, vizwizStore.visualizationCustomizationOptions);
	const visualizationComponents: VisualizationComponents = {
		dataSource: pmResult.vizDatasources,
		dataLayer: pmResult.pointMarkerLayer,
		dataView: pmResult.mapView,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
        vizwizStore.visualizationCustomizationOptions.name,
		'pointmarker',
		getUsedDatastreams(),
	);
	newViz.setVisualizationComponents(visualizationComponents);
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
export function CreateMapViewProps(datastreams: { [key: string]: any }, visOptions: any) {
	const datastreamStore = useDataStreamStore();

    // Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let pointMarkerLayer: IPointMarkerLayerProperties = {
        name: visOptions.name,
        label: visOptions.name,
        icon: visOptions.icon,
        iconName: visOptions.iconName,
        iconSize: [32, 32],
        labelOffset: [-16, -32],
    };
    let mapView: IMapViewProperties = {
        container: `map-container-${randomUUID()}`,
        css: 'map-view',
        layers: [pointMarkerLayer],
        refreshRate: 1000,
    }

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
                username: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
                password: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password
            }
        };
        vizDatasources.push(currentDataSource);
    }

	console.log('Created MapViewProps:', { vizDatasources, pointMarkerLayer, mapView });

	return {
		vizDatasources,
		pointMarkerLayer,
		mapView,
	};
}
