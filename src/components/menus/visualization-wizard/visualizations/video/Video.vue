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
import {fetchControlStreamSchema} from "@/lib/ControlstreamUtils";
import { useVisualizationCleanup } from '../../shared/helpers';

const props = defineProps<{
  visualization: OSHVisualization;
}>();

const videoDivId = ref('video-' + randomUUID());

const controlstreamStore = useControlStreamStore();
const videoView = ref<any>(null);
const videoLayer = ref<VideoDataLayer | null>(null);
const dsInstances: SweApi[] = [];

function createVideoView(codec: string) {
  if (videoView.value) {
    videoView.value.destroy?.();
    videoView.value = null;
  }

  if (codec === 'H264') {
    videoView.value = new VideoView({
      container: videoDivId.value,
      css: 'video-h264',
      showTime: true,
      showStats: true,
      useWebCodecApi: true,
      layers: [],
    });
    console.log("[VideoView] H264 View created:", videoView.value);
  } else {
    videoView.value = new MJPEGView({
      container: videoDivId.value,
      css: 'video-mjpeg',
      showTime: true,
      showStats: true,
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


  const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
      ? viz.visualizationComponents.dataSource
      : [viz.visualizationComponents.dataSource];


  let getFrameData: any;
  let getTimestamp: any;

  for (const dsProps of dsArray) {
    let rawDs = toRaw(dsProps);
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
          return rec[rawDs.properties.video.outputName][rawDs.properties.video.property] != null
              ? rec[rawDs.properties.video.outputName][rawDs.properties.video.property]
              : rec[rawDs.properties.video.property];
        },
      };

      getTimestamp = {
        dataSourceIds: [dsInstance.id],
        handler: (rec: any) => {
          const data = rec[rawDs.properties.video.outputName];
          let newDate = data.time == undefined ? new Date(data.sampleTime).getTime() : new Date(data.time).getTime()

          return Number.isNaN(rec.timestamp) ? newDate : rec.timestamp
        }
      };
    }

    createVideoView(rawDs.properties.video.compression);

    dsInstance.connect();
    dsInstances.push(dsInstance);
  }

  console.log('[Video.vue] Creating datasource for VideoDataLayer:', dsInstances);
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

async function initializePtz() {
  const viz = props.visualization;
  if (!viz.controlstream || Object.keys(viz.controlstream).length === 0)
    return;

  const csId = Object.keys(viz.controlstream)[0];
  if (!csId)
    return;

  const controlStreams = controlstreamStore.getControlStreamsById([csId]);
  if (!controlStreams || controlStreams.length === 0)
    return;

  const cs = controlStreams[0];

  console.log("cs", cs)

  await fetchControlStreamSchema(cs.controlstream.properties, cs.controlstream.networkProperties);
}
onMounted(async() => {
  initializeVideo();
  await initializePtz();
});

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
  <v-card
      :id="videoDivId"
      class="video-mjpeg video-h264"
  >
  </v-card>
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

.ptz-controls {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>