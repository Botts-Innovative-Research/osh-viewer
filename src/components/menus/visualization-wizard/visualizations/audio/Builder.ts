import {useVisualizationStore} from "@/stores/visualizationstore";
import {useVizWizStore} from "@/stores/vizwizstore";
import {AggregateDatastreams, BuildRoleProperty, getUsedDatastreams} from "../../shared/helpers";
//@ts-ignore
import {useDataStreamStore} from "@/stores/datastreamstore";
import {IChartViewProperties, ICurveLayerProperties, ISweApiDataSourceProperties, VisualizationComponents} from "@/lib/VisualizationHelpers";
//@ts-ignore
import {Mode} from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { AudioDescriptor } from "./Descriptor";

export default function build() {
	console.log('Building Audio Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	// Aggregate datastreams from vizwizStore
	const datastreams = AggregateDatastreams();

	const audioResult = CreateAudioViewProps(
		datastreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: audioResult.vizDatasources,
		spectrogramOptions: audioResult.spectrogramOptions,
        audioViewOptions: audioResult.audioViewOptions,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'audio',
		AudioDescriptor.viewLocation,
		getUsedDatastreams()
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Audio Visualization:', newViz);
}

export function CreateAudioViewProps(datastreams: { [key: string]: any }, visOptions: any) {
    const vizwizStore = useVizWizStore();
    const datastreamStore = useDataStreamStore();

    // Create datasources, layer, and view
    const vizDatasources: ISweApiDataSourceProperties[] = [];

    const spectrogramOptions = {
            fftSize: visOptions.fftSize || 2048,
            // The visualizer needs to know which field in the data stream contains the array
            sampleField: vizwizStore.dsConfig['samples']?.property || 'samples',
            colorScale: visOptions.colorScale || 'jet',
        };

    const audioViewOptions = {
        container: `audio-container-${randomUUID()}`,
        css: 'audio-view',
        datasetOptions: { tension: 0.2 },
        refreshRate: 1000,
    }

    for (const [dsId, entry] of Object.entries(datastreams)) {
        const properties = BuildRoleProperty(entry);

        const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);
        const currentDataSource: ISweApiDataSourceProperties = {
            endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
            resource: `/datastreams/${dsId}/observations`,
            tls: currentOSHDatastream[0].datastream.networkProperties.tls,
            protocol: 'ws',
            startTime: 'now',
            endTime: '2125-08-01T00:00:00Z',
            mode: Mode.REAL_TIME,
            responseFormat: 'application/swe+binary',
            id: randomUUID(),
            properties: properties,
            connectorOpts: {
                username: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.username,
                password: currentOSHDatastream[0].datastream.networkProperties.connectorOpts.password
            }
        };
        vizDatasources.push(currentDataSource);
    }

    console.log('Created AudioViewProps:', {vizDatasources, spectrogramOptions, audioViewOptions});

    return {
        vizDatasources,
        spectrogramOptions,
        audioViewOptions,
    };
}