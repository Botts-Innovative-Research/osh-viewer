<script setup lang="ts">
import { computed, onMounted, ref, toRaw } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import VideoDataLayer from 'osh-js/source/core/ui/layer/VideoDataLayer.js';
import { OSHControlStream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import VideoView from 'osh-js/source/core/ui/view/video/VideoView.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import PTZControl from './PTZControl.vue';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { ISweApiDataSourceProperties } from '../../types/datasource';
import { IVideoLayerProperties } from '../../types/layers';
import { IVideoViewProperties } from '../../types/views';
import { fetchControlStreamSchema } from '../../services/controlstream.service';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: ISweApiDataSourceProperties[];
	videoLayer: IVideoLayerProperties;
	videoView: IVideoViewProperties;
	controlstream?: OSHControlStream;
}>();

const videoDivId = ref(props.visualization.id);

const controlstreamStore = useControlStreamStore();
const videoView = ref<any>(null);
const videoLayer = ref<VideoDataLayer | null>(null);
const dsInstances: SweApi[] = [];

function createVideoView(viewConfig: IVideoViewProperties) {
	if (videoView.value) {
		videoView.value.destroy?.();
		videoView.value = null;
	}

	videoView.value = new VideoView({
		...viewConfig,
		container: videoDivId.value,
		layers: [],
	});
}

const ptzControl = computed(() => {
	if (props.controlstream && Object.keys(props.controlstream).length > 0) {
		const csId = props.controlstream.id;
		if (!csId) return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };

		const controlStreams = controlstreamStore.getControlStreamsById([csId]);
		if (!controlStreams || controlStreams.length === 0)
			return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };

		const cs = controlStreams[0];
		const networkProps = cs.controlstream.networkProperties;

		const protocol = networkProps.tls ? 'https' : 'http';
		const baseUrl = `${protocol}://${networkProps.endpointUrl}`;

		const auth = `${networkProps.connectorOpts.username}:${networkProps.connectorOpts.password}`;

		return {
			hasControl: true,
			commandBaseUrl: baseUrl,
			id: csId,
			auth: auth,
		};
	}
	return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };
});

function initializeVideo() {
	const viz = props.visualization;
	if (!viz || viz.type !== 'video') return;

	const dsArray: ISweApiDataSourceProperties[] = props.datasource;

	let getFrameData: any;
	let getTimestamp: any;

	for (const dsProps of dsArray) {
		let rawDs = toRaw(dsProps);
		const dsInstance = createDatasource(dsProps);

		if (dsProps.properties.video) {
			getFrameData = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return rec[rawDs.properties.video.property];
				},
			};

			getTimestamp = {
				dataSourceIds: [dsInstance.id],
				handler: (rec: any) => {
					return rec.timestamp;
				},
			};
		}
		const viewConfig = props.videoView;
		createVideoView(viewConfig);

		dsInstance.connect();
		dsInstances.push(dsInstance);
	}

	console.log('[Video.vue] Creating datasource for VideoDataLayer:', dsInstances);
	const layerOpts = props.videoLayer;
	videoLayer.value = new VideoDataLayer({
		...layerOpts,
		name: viz.name,
		dataSourceIds: dsInstances.map((ds) => ds.id),
		...(getFrameData ? { getFrameData } : {}),
		...(getTimestamp ? { getTimestamp } : {}),
	});
	videoView.value.addLayer(videoLayer.value);
	console.log('[VideoView] Creating VideoDataLayer:', videoLayer.value);
}

async function initializePtz() {
	if (!props.controlstream || Object.keys(props.controlstream).length === 0) return;

	const csId = props.controlstream.id;
	if (!csId) return;

	const controlStreams = controlstreamStore.getControlStreamsById([csId]);
	if (!controlStreams || controlStreams.length === 0) return;

	const cs = controlStreams[0];

	await fetchControlStreamSchema(cs.controlstream.properties, cs.controlstream.networkProperties);
}
onMounted(async () => {
	initializeVideo();
	await initializePtz();
});

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
	<v-sheet
		:id="videoDivId"
		class="video-mjpeg video-h264"
	>
	</v-sheet>
	<PTZControl
		v-if="ptzControl.hasControl"
		:command-base-url="ptzControl.commandBaseUrl"
		:id="ptzControl.id"
		:auth="ptzControl.auth"
	/>
</template>

<style>
.video-h264 canvas {
	width: 100%;
	height: auto;
}

.video-mjpeg {
	width: 100%;
	height: auto;
}
</style>
