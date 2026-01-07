import { OSHDatastream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
    ISweApiDataSourceProperties, IVideoViewProperties,
    VisualizationComponents,
} from '@/lib/VisualizationHelpers';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { AggregateDatastreams, AggregateControlstreams, BuildRoleProperty } from '../../shared/helpers';
import {toRaw} from "vue";
import {useControlStreamStore} from "@/stores/controlstreamstore";

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

	const newViz: OSHVisualization = new OSHVisualization(
		`visualization-${randomUUID()}`,
		`${videoResult.videoLayer.name}`,
		'video',
		null,
		datastreams,
		controlstreams
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
    const controlstreamStore = useControlStreamStore();

	const vizDatasources: ISweApiDataSourceProperties[] = [];
	let videoLayer: any = {};
    let videoView: any = {
        container: `video-container-${randomUUID()}`,
        css: 'video-view',
        width: 640,
        height: 480,
        showTime: true,
        showStats: true,
    }

    const videoFormat = visOptions?.videoFormat || 'MJPEG'; // default to mjpeg? or maybe h264 idc

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

        let ds = toRaw(currentOSHDatastream[0]);

        videoLayer = {
            ...videoLayer,
            name: `${ds.datastream.properties.name}`,
        };

        videoView = {
            ...videoView,
            name: `${ds.datastream.properties.name}`,
            layers: [videoLayer],
            useWebCodecApi: videoFormat === 'MJPEG' ? false : true,
            videoType: videoFormat,
        };
        console.log('Created VideoViewProps:', { vizDatasources, videoLayer, videoView });
    }

	return {
		vizDatasources,
		videoLayer,
		videoView,
	};
}
