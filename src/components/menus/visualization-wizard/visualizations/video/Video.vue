<script setup lang="ts">
import {computed, onMounted, ref, toRaw} from 'vue';
import {randomUUID} from 'osh-js/source/core/utils/Utils.js';
import VideoDataLayer from 'osh-js/source/core/ui/layer/VideoDataLayer.js';
import {OSHVisualization} from '@/lib/OSHConnectDataStructs';
import MJPEGView from 'osh-js/source/core/ui/view/video/MjpegView.js';
import VideoView from 'osh-js/source/core/ui/view/video/VideoView.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import PTZControl from './PTZControl.vue'
import {useControlStreamStore} from "@/stores/controlstreamstore";

const props = defineProps<{
  visualization: OSHVisualization;
}>();

const videoDivId = ref('video-' + randomUUID());
const videoCanvas = ref<HTMLCanvasElement | null>(null);
const videoHeight = ref(360);
const videoWidth = ref(480);

const controlstreamStore = useControlStreamStore();
const videoView = ref<any>(null);
const videoLayer = ref<VideoDataLayer | null>(null);

function createVideoView(videoType: string) {
  if (videoView.value) {
    videoView.value.destroy?.();
    videoView.value = null;
  }

  if (videoType === 'H264') {
    videoView.value = new VideoView({
      container: videoDivId.value,
      css: 'video-h264',
      showTime: true,
      showStats: true,
      useWebCodecApi: true,
      width: videoWidth.value,
      height: videoHeight.value,
      layers: [],
    });
    console.log("[VideoView] H264 View created:", videoView.value);
  } else {
    videoView.value = new MJPEGView({
      container: videoDivId.value,
      css: 'video-mjpeg',
      showTime: true,
      showStats: true,
      width: videoWidth.value,
      height: videoHeight.value,
      layers: [],
    });
    console.log("[VideoView] MJPEG View created:", videoView.value);
  }
}

const ptzControl = computed(() => {
  const viz = props.visualization;
  if (viz.controlstream && Object.keys(viz.controlstream).length > 0) {
    const csId = Object.keys(viz.controlstream)[0];
    if (!csId) return {hasControl: false, commandBaseUrl: '', id: '', auth: ''};

    const controlStreams = controlstreamStore.getControlStreamsById([csId]);
    if (!controlStreams || controlStreams.length === 0) return {hasControl: false, commandBaseUrl: '', id: '', auth: ''};

    const cs = controlStreams[0];
    const networkProps = cs.controlstream.networkProperties;

    const protocol = networkProps.tls ? 'https' : 'http';
    const baseUrl = `${protocol}://${networkProps.endpointUrl}`

    const auth = `${networkProps.connectorOpts.username}:${networkProps.connectorOpts.password}`

    return {
      hasControl: true,
      commandBaseUrl: baseUrl,
      id: csId,
      auth: auth
    }
  }
  return {hasControl: false, commandBaseUrl: '', id: '', auth: ''};
})

function initializeVideo() {
  const viz = props.visualization;
  if (!viz || viz.type !== 'video') return;

  const videoType = viz.visualizationComponents?.dataView?.videoType || 'MJPEG';
  createVideoView(videoType);

  const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
      ? viz.visualizationComponents.dataSource
      : [viz.visualizationComponents.dataSource];

  const dsInstances: SweApi[] = [];

  let getFrameData: any;
  let getTimestamp: any;

  for (const dsProps of dsArray) {
    const dsInstance = new SweApi(dsProps.id, {
      endpointUrl: dsProps.endpointUrl,
      resource: dsProps.resource,
      tls: dsProps.tls,
      protocol: dsProps.protocol,
      startTime: dsProps.startTime,
      endTime: dsProps.endTime,
      mode: dsProps.mode,
      responseFormat: dsProps.responseFormat,
      connectorOpts: {
        username: dsProps?.connectorOpts.username,
        password: dsProps?.connectorOpts.password
      }
    });

    if (dsProps.properties.video) {
      getFrameData = {
        dataSourceIds: [dsInstance.id],
        handler: (rec: any) => {
          let rawDs = toRaw(dsProps);
          return rec[rawDs.properties.video.outputName][rawDs.properties.video.property] != null
              ? rec[rawDs.properties.video.outputName][rawDs.properties.video.property]
              : rec[rawDs.properties.video.property];
        },
      };

      getTimestamp = {
        dataSourceIds: [dsInstance.id],
        handler: (rec: any) => {
          let rawDs = toRaw(dsProps);
          const data = rec[rawDs.properties.video.outputName];
          let newDate = data.time == undefined ? new Date(data.sampleTime).getTime() : new Date(data.time).getTime()

          return Number.isNaN(rec.timestamp) ? newDate : rec.timestamp
        }
      };
    }

    dsInstance.connect();
    dsInstances.push(dsInstance);
  }

  console.log('[VideoView] Creating datasource for VideoDataLayer:', dsInstances);
  const layerOpts = viz.visualizationComponents.dataLayer;
  videoLayer.value = new VideoDataLayer({
    ...layerOpts,
    name: viz.name,
    dataSourceIds: dsInstances.map(ds => ds.id),
    ...(getFrameData ? {getFrameData} : {}),
    ...(getTimestamp ? {getTimestamp} : {}),
  });
  videoView.value.addLayer(videoLayer.value);
  console.log('[VideoView] Creating VideoDataLayer:', videoLayer.value);
}

onMounted(() => {
  initializeVideo();
});

</script>

<template>
  <v-card
      :id="videoDivId"
      class="video-container pa-4"
      :style="{ width: videoWidth + 'px', height: videoHeight + 'px' }"
  >
    <v-card-title class="text-h5 text-center">
      {{ props.visualization.name || 'Video' }}
    </v-card-title>
  </v-card>
  <PTZControl
      v-if="ptzControl.hasControl"
      :command-base-url="ptzControl.commandBaseUrl"
      :id="ptzControl.id"
      :auth="ptzControl.auth"
  />
</template>

<style scoped>
.video-h264, .video-mjpeg {
  width: 100%;
}

.video-container {
  width: 480px;
  height: 360px;
}

.ptz-controls {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>