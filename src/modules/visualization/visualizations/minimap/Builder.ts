import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { useDataStreamStore } from '@/stores/datastreamstore';
import { MiniMapDescriptor } from './Descriptor';
import {
	AggregateDatastreams,
	BuildRoleProperty,
	getUsedDatastreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import { IConSysApiDataSourceProperties } from '../../types/datasource';


export default function build() {
	console.log('Building Mini Map Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const dsConfig = { ...vizwizStore.dsConfig };
	for (const [role, entry] of Object.entries(dsConfig)) {
		if ((entry as any).dsId && !(entry as any).selected) {
			(dsConfig as any)[role] = { ...entry as any, selected: true };
		}
	}
	const datastreams = AggregateDatastreams(dsConfig);

	const minimapResult = CreateMiniMapVizProps(datastreams);

	const visualizationComponents: VisualizationComponents = {
		dataSource: minimapResult.vizDatasources,
		dataLayer: [],
		controlstream: [],
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'minimap',
		MiniMapDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		[]
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig());
	visualizationStore.addVisualization(newViz);
	console.log('Created Mini Map Visualization:', newViz);
}

export function CreateMiniMapVizProps(datastreams: { [key: string]: any }
) {
	const datastreamStore = useDataStreamStore();

	const vizDatastreams: IConSysApiDataSourceProperties[] = [];

	for (const [dsId, entry] of Object.entries(datastreams)) {
		const properties = BuildRoleProperty(entry);

		const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);

		const hasVideoRole = properties.video !== undefined;

		const currentDatastream: IConSysApiDataSourceProperties = {
			endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${dsId}/observations`,
			tls: currentOSHDatastream[0].datastream.networkProperties.tls,
			protocol: 'ws',
			mode: Mode.REAL_TIME,
			responseFormat: hasVideoRole ? 'application/swe+binary' : 'application/swe+json',
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

	return {
		vizDatasources: vizDatastreams
	};
}