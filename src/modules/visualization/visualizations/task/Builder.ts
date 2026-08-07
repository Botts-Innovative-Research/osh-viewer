import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import {OSHControlStream, OSHVisualization} from '@/lib/OSHConnectDataStructs';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { TaskDescriptor } from './Descriptor';
import {
    AggregateControlstreams,
    BuildRoleProperty, getUsedControlstreams,
} from '../../services/aggregation.service';
import { VisualizationComponents } from '../../types/visualization';
import {IConSysApiControlStreamProperties} from '../../types/datasource';
import { useControlStreamStore } from '@/stores/controlstreamstore';

export default function build() {
	console.log('Building Task Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

    const controlstreams = AggregateControlstreams(vizwizStore.csConfig);

	const taskResult = CreateTaskVizProps(controlstreams);

    const visualizationComponents: VisualizationComponents = {
        dataLayer: [],
        controlstream: taskResult.vizControlstreams,
    };

	const newViz = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'task',
        TaskDescriptor.viewLocation,
        null,
        getUsedControlstreams(vizwizStore.controlstreams, vizwizStore.csConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Task Visualization:', newViz);
}

export function CreateTaskVizProps(
    controlstreams: { [key: string]: any }
) {
    const controlstreamStore = useControlStreamStore();
    const vizControlstreams: IConSysApiControlStreamProperties[] = [];

    // Iterate through each unique controlstream ID
    for (const [csId, entry] of Object.entries(controlstreams)) {
        // Get selected properties for each role of the controlstream
        const properties = BuildRoleProperty(entry);

        // Push new IConSysApiDataSourceProperties
        const currentOSHControlstream: OSHControlStream = controlstreamStore.getControlStreamsById([
            csId,
        ])[0];
        const csProps = currentOSHControlstream.controlstream.properties;
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
            name: currentOSHControlstream.name,
            inputName: csProps?.inputName,
            controlledProperties: csProps?.controlledProperties,
        };
        vizControlstreams.push(currentControlstream);
	}

	return {
        vizControlstreams: vizControlstreams
    };
}
