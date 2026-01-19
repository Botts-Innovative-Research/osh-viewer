import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiDataSourceProperties, VisualizationComponents } from '@/lib/VisualizationHelpers';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { AggregateControlstreams, BuildRoleProperty } from '../../shared/helpers';
import { useControlStreamStore } from '@/stores/controlstreamstore';

export function build() {
    console.log('Building Flight Path Visualization...');
    const vizwizStore = useVizWizStore();
    const visualizationStore = useVisualizationStore();

    const datastreams = vizwizStore.datastreams;
    const controlstreams = AggregateControlstreams();

    console.log(datastreams)

    const flightPathResult = CreateFlightPathViewProps(
        datastreams[0],
        controlstreams,
        vizwizStore.visualizationCustomizationOptions
    );

    const visualizationComponents: VisualizationComponents = {
        dataSource: flightPathResult.vizDatasources,
        dataLayer: null,
        dataView: null
    };

    const newViz: OSHVisualization = new OSHVisualization(
        `visualization-${randomUUID()}`,
        `FlightPath`,
        'flightPath',
        null,
        flightPathResult.vizDatasources,
        flightPathResult.vizControlstreams[0]
    );
    newViz.setVisualizationComponents(visualizationComponents);
    visualizationStore.addVisualization(newViz);
    console.log('Created Flight Path Visualization:', newViz);
}

export function CreateFlightPathViewProps(datastream: OSHDatastream, controlstreams: { [key: string]: any }, visOptions: any) {
    const controlstreamStore = useControlStreamStore();
    console.log('Controlstreams: ', controlstreamStore.controlStreams);

    const vizControlstreams: any[] = [];

    // Push new ISweApiDataSourceProperties
    console.log('Current OSH Datastream: ', datastream);
    const currentDataSource: ISweApiDataSourceProperties = {
        endpointUrl: datastream.datastream.networkProperties.endpointUrl,
        resource: `/datastreams/${datastream.id}/observations`,
        tls: datastream.datastream.networkProperties.tls,
        protocol: 'ws',
        startTime: 'now',
        endTime: '2125-08-01T00:00:00Z',
        mode: Mode.REAL_TIME,
        responseFormat: 'application/swe+json',
        id: randomUUID(),
        connectorOpts: {
            username: datastream.datastream.networkProperties.connectorOpts.username,
            password: datastream.datastream.networkProperties.connectorOpts.password
        }
    };

    // Iterate through each unique controlstream ID
    for (const [csId, entry] of Object.entries(controlstreams)) {
        console.log('Processing controlstream ID:', csId, 'with entry:', entry);

        // Get selected properties for each role of the controlstream
        const properties = BuildRoleProperty(entry);

        // Push new ISweApiDataSourceProperties
        const currentOSHControlstream = controlstreamStore.getControlStreamsById([csId])[0];
        const currentControlstream: any = {
            endpointUrl: currentOSHControlstream.controlstream.networkProperties.endpointUrl,
            // resource: `/datastreams/${csId}/observations`,
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
        vizDatasources: currentDataSource,
        vizControlstreams: vizControlstreams
    };
}
