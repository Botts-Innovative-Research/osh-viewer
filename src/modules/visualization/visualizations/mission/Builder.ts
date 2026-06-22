import { OSHControlStream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { MissionDescriptor } from './Descriptor';
import {
	AggregateControlstreams,
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedControlstreams,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import {
	IConSysApiControlStreamProperties,
	IConSysApiDataSourceProperties,
} from '../../types/datasource';

export default function build() {
	console.log('Building Mission Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);
	const controlstreams = AggregateControlstreams(vizwizStore.csConfig);

	const missionResult = CreateMissionVizProps(datastreams, controlstreams);

	const visualizationComponents: VisualizationComponents = {
		dataSource: missionResult.vizDatasources,
		dataLayer: [],
		controlstream: missionResult.vizControlstreams,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'mission',
		MissionDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		getUsedControlstreams(vizwizStore.controlstreams, vizwizStore.csConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Mission Visualization:', newViz);
}

export function CreateMissionVizProps(
	datastreams: { [key: string]: any },
	controlstreams: { [key: string]: any }
) {
	const controlstreamStore = useControlStreamStore();
	const datastreamStore = useDataStreamStore();

	const vizControlstreams: IConSysApiControlStreamProperties[] = [];
	const vizDatastreams: IConSysApiDataSourceProperties[] = [];

	for (const [dsId, entry] of Object.entries(datastreams)) {
		const properties = BuildRoleProperty(entry);

		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);

		const currentDatastream: IConSysApiDataSourceProperties = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: currentOSHDatastream[0].id,
			properties: properties,
			connectorOpts: {
				username:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
				password:
					currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password,
			},
		};
		vizDatastreams.push(currentDatastream);
	}
	for (const [csId, entry] of Object.entries(controlstreams)) {
		const properties = BuildRoleProperty(entry);

		const currentOSHControlstream: OSHControlStream = controlstreamStore.getControlStreamsById([
			csId,
		])[0];
		const currentControlstream: IConSysApiControlStreamProperties = {
			endpointUrl: currentOSHControlstream.controlstream.networkProperties.endpointUrl,
			tls: currentOSHControlstream.controlstream.networkProperties.tls,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2125-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
			id: currentOSHControlstream.id,
			properties: properties,
			connectorOpts: {
				username:
					currentOSHControlstream.controlstream.networkProperties.connectorOpts.username,
				password:
					currentOSHControlstream.controlstream.networkProperties.connectorOpts.password,
			},
		};
		vizControlstreams.push(currentControlstream);
	}

	return {
		vizDatasources: vizDatastreams,
		vizControlstreams: vizControlstreams,
	};
}
