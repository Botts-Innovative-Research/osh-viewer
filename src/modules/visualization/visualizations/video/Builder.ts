import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
    ISweApiDataSourceProperties, IVideoLayerProperties, IVideoViewProperties,
    VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { VideoDescriptor } from './Descriptor';
import { AggregateControlstreams, AggregateDatastreams, BuildRoleProperty, getUsedControlstreams, getUsedDatastreams } from '../../services/aggregation.service';


export default function build() {
	console.log('Building Video Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams(vizwizStore.dsConfig);
	const controlstreams = AggregateControlstreams(vizwizStore.csConfig);

	const videoResult = CreateVideoViewProps(
		datastreams,
		controlstreams,
		vizwizStore.visualizationCustomizationOptions
	);
	const visualizationComponents: VisualizationComponents = {
		dataSource: videoResult.vizDatasources,
		dataLayer: videoResult.videoLayer,
		dataView: videoResult.videoView,
	};

	const newViz: OSHVisualization = new OSHVisualization(
		vizwizStore.id,
		vizwizStore.visualizationCustomizationOptions.name,
		'video',
		VideoDescriptor.viewLocation,
		getUsedDatastreams(vizwizStore.datastreams, vizwizStore.dsConfig),
		getUsedControlstreams(vizwizStore.controlstreams, vizwizStore.csConfig)
	);
	newViz.setVisualizationComponents(visualizationComponents);
	newViz.setWizardConfig(vizwizStore.getWizardConfig()); // Save wizard state in visualization
	visualizationStore.addVisualization(newViz);
	console.log('Created Video Visualization:', newViz);
}

/**
 * Creates properties for a Video View based on the provided datastream, selected property, and visualization options.
 * @param ds
 * @param selectedProperty
 * @param visOptions
 * @constructor
 */
export function CreateVideoViewProps(datastreams: { [key: string]: any }, controlstreams: { [key: string]: any }, visOptions: any) {
	const datastreamStore = useDataStreamStore();

    // Create datasources, layer, and view
	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let videoLayer: IVideoLayerProperties = {
        name: visOptions.name,
        getFrameData(rec, timestamp) {
            return;
        },
        getTimestamp(rec, timestamp) {
            return;
        },
    };
    let videoView: IVideoViewProperties = {
        container: `video-container-${randomUUID()}`,
        css: 'video-view',
        layers: [videoLayer],
        width: 640,
        height: 480,
        useWebCodecApi: true,
        showTime: visOptions?.time,
        showStats: visOptions?.stats,
    }


	for (const [dsId, entry] of Object.entries(datastreams)) {
        const properties = BuildRoleProperty(entry);

        const currentOSHDatastream = datastreamStore.getDataStreamsById([dsId]);
        const currentDataSource: ISweApiDataSourceProperties = {
            endpointUrl: currentOSHDatastream[0].datastream.networkProperties.endpointUrl,
            resource: `/datastreams/${dsId}/observations`,
            tls: currentOSHDatastream[0].datastream.networkProperties.tls,
            protocol: 'ws',
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

    console.log('Created VideoViewProps:', { vizDatasources, videoLayer, videoView });

	return {
		vizDatasources,
		videoLayer,
		videoView,
	};
}
