<script setup lang="ts">
import {onMounted, ref, toRaw, watch} from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import VideoDataLayer from 'osh-js/source/core/ui/layer/VideoDataLayer.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import MJPEGView from 'osh-js/source/core/ui/view/video/MjpegView.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { computed } from 'vue';
import PTZControl from './PTZControl.vue';
import {useVisualizationStore} from "@/stores/visualizationstore";
import {useControlStreamStore} from "@/stores/controlstreamstore";


const videoDivId = ref('video-' + randomUUID());
const videoCanvas = ref<HTMLCanvasElement | null>(null);
const videoHeight = ref(360);
const videoWidth = ref(480);

const visualizationStore = useVisualizationStore();
const controlstreamStore = useControlStreamStore();
const videoView = ref<any>(null);
const currentVisualizations = ref<OSHVisualization[]>([]);
const videoLayers = ref<VideoDataLayer[]>([]);

const videoVisualizations = computed(() => {
  return visualizationStore.visualizations.filter(
      (viz) => viz.type === 'video'
  );
});

const ptzControl = computed(() => {
  for (const viz of videoVisualizations.value) {
    if (viz.controlstream && Object.keys(viz.controlstream).length > 0) {
      const csId = Object.keys(viz.controlstream)[0];
      if (!csId) continue;

      const controlStreams = controlstreamStore.getControlStreamsById([csId]);
      if (!controlStreams || controlStreams.length === 0) continue;

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
  }
  return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };
})

function processVisualizations(updated: OSHVisualization[]) {
  if (!videoView.value) return;

  const removed = currentVisualizations.value.filter((val) => !updated.includes(val));
  for (const viz of removed) {
    const idx = currentVisualizations.value.indexOf(viz);
    if (idx !== -1) {
      currentVisualizations.value.splice(idx, 1);
      const videoLayer = videoLayers.value[idx];
      if (videoLayer && videoView.value) {
        videoView.value.removeLayer?.(videoLayer);
      }
      videoLayers.value.splice(idx, 1);
    }
  }

  const newFiltered = updated.filter(val => !currentVisualizations.value.includes(val));
  console.log('New visualizations:', newFiltered);

  for (const viz of newFiltered) {
    currentVisualizations.value.push(viz);
    if (viz.type === 'video') {
      console.log("viz ds", viz.visualizationComponents.dataSource);
      const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
          ? viz.visualizationComponents.dataSource
          : [viz.visualizationComponents.dataSource];

      const dsInstances: SweApi[] = [];

      let getFrameData: any;
      let getTimestamp: any;

      for (const dsProps of dsArray) {
        console.log('[Video.vue] dsProps:', dsProps);
        console.log('[Video.vue] dsProps.properties:', dsProps.properties);
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

        // Check for video property
        if (dsProps.properties.video) {
          getFrameData = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => {
              let rawDs = toRaw(dsProps);
              return rec[rawDs.properties.video.outputName][rawDs.properties.video.property] != null ? rec[rawDs.properties.video.outputName][rawDs.properties.video.property] : rec[rawDs.properties.video.property];
            },
          };

          getTimestamp = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => {
              let rawDs = toRaw(dsProps);
              let newDate = new Date(rec[rawDs.properties.video.outputName].time).getTime();
              return Number.isNaN(rec.timestamp) ? newDate : rec.timestamp;
            }
          };
        }

        dsInstance.connect();
        dsInstances.push(dsInstance);
      }

      console.log('[VideoView] Creating datasource for VideoDataLayer:', dsInstances);
      const layerOpts = viz.visualizationComponents.dataLayer;
      const videoLayer = new VideoDataLayer({
        ...layerOpts,
        name: viz.name,
        dataSourceIds: dsInstances.map(ds => ds.id),
        ...(getFrameData ? { getFrameData } : {}),
        ...(getTimestamp ? { getTimestamp } : {}),
      });
      videoLayers.value.push(videoLayer);
      videoView.value.addLayer(videoLayer);
      console.log('[VideoView] Creating VideoDataLayer:', videoLayer);
    }

  }
}

onMounted(() => {
    let videoMjpegView = new MJPEGView({
      container: videoDivId.value,
      css: 'video-h264',
      showTime: true,
      showStats: true,
      useWebCodecApi: true,
      width: videoWidth.value,
      height: videoHeight.value,
      layers: [],
    });

    videoView.value = videoMjpegView;

    console.log("[VideoView] MJPEG View created:", videoView.value);

    // Process any existing visualizations
    if (videoVisualizations.value.length > 0) {
      processVisualizations(videoVisualizations.value);
    }
});

</script>

<template>
	<v-card
		:id="videoDivId"
		class="video-container pa-4"
		:style="{ width: videoWidth + 'px', height: videoHeight + 'px' }"
	>
		<v-card-title class="text-h5 text-center">
<!--      {{ props.visualization.name || props.videoTitle }}-->
      Video
    </v-card-title>
		<!-- Video content will be rendered here -->
	</v-card>
	<PTZControl
		v-if="ptzControl.hasControl"
		:command-base-url="ptzControl.commandBaseUrl"
		:id="ptzControl.id"
		:auth="ptzControl.auth"
	/>
</template>

<style scoped>
.video-h264 {
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
