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
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateDatastreams, AggregateControlstreams, BuildRoleProperty, getUsedDatastreams, getUsedControlstreams } from '../../shared/helpers';


export function build() {
	console.log('Building Video Visualization...');
	const vizwizStore = useVizWizStore();
	const visualizationStore = useVisualizationStore();

	const datastreams = AggregateDatastreams();
    const controlstreams = AggregateControlstreams();

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

    console.log(getUsedControlstreams())

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
        vizwizStore.visualizationCustomizationOptions.name,
		'video',
		getUsedDatastreams(),
		getUsedControlstreams()
	);
	newViz.setVisualizationComponents(visualizationComponents);
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
