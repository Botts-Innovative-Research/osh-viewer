import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
	ILineOfBearingLayerProperties,
	IMapViewProperties,
	ISweApiDataSourceProperties,
} from '@/lib/VisualizationHelpers';
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { useVizWizStore } from '@/stores/vizwizstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { AggregateDatastreams, BuildRoleProperty, getUsedDatastreams } from '../../shared/helpers';
import { useDataStreamStore } from '@/stores/datastreamstore';

export function build() {
	console.log('Building LOB Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams();

	const lobResult = CreateLobViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents = {
		dataSource: lobResult.vizDatasources,
		dataLayer: lobResult.lobLayer,
		dataView: lobResult.lobView,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		vizwizStore.visualizationCustomizationOptions.name,
		'lob',
		getUsedDatastreams(),
	);
	newViz.setVisualizationComponents(visualizationComponents);
	visualizationStore.addVisualization(newViz);
	console.log('Created Line of Bearing Visualization:', newViz);
}

/**
 * Creates properties for a Line of Bearing View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedLocationProperty
 * @param dsOptions
 * @constructor
 */
export function CreateLobViewProps(datastreams: { [key: string]: any }, visOptions: any) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let lobLayer: ILineOfBearingLayerProperties = {
		color: visOptions.lineColor,
		weight: visOptions.weight,
		opacity: visOptions.opacity,
		distanceKm: visOptions.distanceKm,
		icon: visOptions.icon,
		iconColor: visOptions.iconColor,
		iconName: visOptions.iconName,
		iconSize: [32, 32],
		labelOffset: [-16, -32],
		label: visOptions.name,
		name: visOptions.name,
	};
	const lobView: IMapViewProperties = {
		container: `map-container-${randomUUID()}`,
		layers: [lobLayer],
		css: 'map-view',
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
					username: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
					password: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password
				}
		};
		vizDatasources.push(currentDataSource);
	}

	console.log('Created LOBViewProperties:', { vizDatasources, lobLayer, lobView });

	return {
		vizDatasources,
		lobLayer,
		lobView,
	};
}

