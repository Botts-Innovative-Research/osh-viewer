import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
    ISweApiControlStreamProperties,
    ISweApiDataSourceProperties,
    VisualizationComponents
} from '@/lib/VisualizationHelpers';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { Mode } from 'osh-js/source/core/datasource/Mode';
import {
    AggregateControlstreams,
    AggregateDatastreams,
    BuildRoleProperty,
    getUsedControlstreams,
    getUsedDatastreams
} from '../../shared/helpers';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import {useDataStreamStore} from "@/stores/datastreamstore";

export function build() {
    console.log('Building Mission Visualization...');
    const vizwizStore = useVizWizStore();
    const visualizationStore = useVisualizationStore();


    const datastreams = AggregateDatastreams();
    const controlstreams = AggregateControlstreams();

    const missionResult = CreateMissionViewProps(
        datastreams,
        controlstreams,
        vizwizStore.visualizationCustomizationOptions
    );

    const visualizationComponents: VisualizationComponents = {
        dataSource: missionResult.vizDatasources,
        dataLayer: null,
        dataView: null,
        controlstream: missionResult.vizControlstreams
    };

    const newViz: OSHVisualization = new OSHVisualization(
        `visualization-${randomUUID()}`,
        `Mission Planner`,
        'mission',
        getUsedDatastreams(),
        getUsedControlstreams()
    );
    newViz.setVisualizationComponents(visualizationComponents);
    visualizationStore.addVisualization(newViz);
    console.log('Created Mission Visualization:', newViz);
}

export function CreateMissionViewProps(datastreams:  { [key: string]: any }, controlstreams: { [key: string]: any }, visOptions: any) {
    const controlstreamStore = useControlStreamStore();
    const datastreamStore = useDataStreamStore();

    const vizControlstreams: ISweApiControlStreamProperties[] = [];
    const vizDatastreams: ISweApiDataSourceProperties[] = [];

    for (const [dsId, entry] of Object.entries(datastreams)) {
        const properties = BuildRoleProperty(entry);

        const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);

        const currentDatastream: ISweApiDataSourceProperties = {
            endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
            resource: `/datastreams/${dsId}/observations`,
            tls: currentOSHDatastream[0].datastream.networkProperties.tls,
            protocol: 'ws',
            mode: Mode.REAL_TIME,
            responseFormat: 'application/swe+json',
            id: currentOSHDatastream[0].id,
            properties: properties,
            connectorOpts: {
                username: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
                password: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password
            }
        };
        vizDatastreams.push(currentDatastream);
    }
    for (const [csId, entry] of Object.entries(controlstreams)) {
        const properties = BuildRoleProperty(entry);

        const currentOSHControlstream = controlstreamStore.getControlStreamsById([csId])[0];
        const currentControlstream: ISweApiControlStreamProperties = {
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
                username: currentOSHControlstream.controlstream.networkProperties.connectorOpts.username,
                password: currentOSHControlstream.controlstream.networkProperties.connectorOpts.password
            }
        };
        vizControlstreams.push(currentControlstream);
    }

    return {
        vizDatasources: vizDatastreams,
        vizControlstreams: vizControlstreams
    };
}
