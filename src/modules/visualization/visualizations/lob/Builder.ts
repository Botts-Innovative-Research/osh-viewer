import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { useVizWizStore } from '@/stores/vizwizstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { LobDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { ILineOfBearingCustomizationOptions } from '../../types/customization';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { ILineOfBearingLayerProperties } from '../../types/layers';
import { VisualizationComponents } from '../../types/visualization';
import { ICON_BASE } from '@/lib/icons';

export default function build() {
	console.log('Building LOB Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);

	const lobResult = CreateLobVizProps(datastreams, vizwizStore.visualizationCustomizationOptions);
	const visualizationComponents: VisualizationComponents = {
		dataSource: lobResult.vizDatasources,
		dataLayer: lobResult.lobLayer,
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
	console.log('Created LOB Visualization:', newViz);
}

/**
 * Creates properties for a Line of Bearing View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedLocationProperty
 * @param dsOptions
 * @constructor
 */
export function CreateLobVizProps(
	datastreams: { [key: string]: any },
	visOptions: ILineOfBearingCustomizationOptions
) {
	const datastreamStore = useDataStreamStore();

	// Create datasources, layer, and view
	const vizDatasources: IConSysApiDataSourceProperties[] = [];
	let lobLayer: ILineOfBearingLayerProperties = {
		color: visOptions.lineColor,
		weight: visOptions.lobWeight,
		opacity: visOptions.lobOpacity,
		length: visOptions.lobDistanceKm * 1000, // Convert km to m
		icon: visOptions.showIcon ? `${ICON_BASE}${visOptions.icon}` : null,
		iconColor: visOptions.iconColor,
		iconName: visOptions.iconName,
		iconOpacity: visOptions.showIcon ? 1 : 0, // Set opacity to 0 if no icon, otherwise use default opacity
		iconSize: [32, 32],
		label: visOptions.name,
		name: visOptions.name,
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
		lobLayer,
	};
}
