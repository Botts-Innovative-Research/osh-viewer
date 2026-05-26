import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
	ILineOfBearingCustomizationOptions,
	ILineOfBearingLayerProperties,
	IMapViewProperties,
	ISweApiDataSourceProperties,
} from '@/lib/VisualizationHelpers';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useVizWizStore } from '@/stores/vizwizstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { LobDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';

export default function build() {
	console.log('Building LOB Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

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
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'lob',
		LobDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
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
export function CreateLobViewProps(
	datastreams: { [key: string]: any },
	visOptions: ILineOfBearingCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let lobLayer: ILineOfBearingLayerProperties = {
		color: visOptions.lineColor,
		weight: visOptions.lobWeight,
		opacity: visOptions.lobOpacity,
		length: visOptions.lobDistanceKm * 1000, // Convert km to m
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
				username:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password,
			},
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
