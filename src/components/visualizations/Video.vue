<script setup lang="ts">

import { defineProps, onMounted, ref } from 'vue'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import VideoDataLayer from 'osh-js/source/core/ui/layer/VideoDataLayer.js'
import VideoView from 'osh-js/source/core/ui/view/video/VideoView.js'
import { createVideoDataSource } from '@/components/visualizations/DataComposables'
import { OSHVisualization } from '@/lib/OSHConnectDataStructs'
import MJPEGView from 'osh-js/source/core/ui/view/video/MjpegView.js'
import { SweApiDataSourceProperties, VideoLayerProperties, VideoViewProperties } from '@/lib/VisualizationHelpers'
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js'
import PTZTaskingComponent from '@/components/PTZTaskingComponent.vue'

const props = defineProps({
  visualization: {
    type: OSHVisualization,
    required: true,
    default: null
  },
  videoTitle: {
    type: String,
    required: false,
    default: 'Video Stream'
  },
  showTime: {
    type: Boolean,
    required: false,
    default: true
  },
  showStats: {
    type: Boolean,
    required: false,
    default: true
  },
  datasource: {
    type: SweApiDataSourceProperties,
    required: false,
    default: null
  },
  videoLayer: {
    type: VideoLayerProperties,
    required: false,
    default: null
  },
  videoView: {
    type: VideoViewProperties,
    required: false,
    default: null
  }
})

const videoDivId = ref('video-' + randomUUID());
const videoCanvas = ref<HTMLCanvasElement | null>(null);
const videoHeight = ref(360);
const videoWidth = ref(480);

function oldSetup() {
  console.log('Video component mounted with OSHVisualization:', props.visualization)

  const datasource = createVideoDataSource(props.visualization.parentDatastream)

  const videolayer = new VideoDataLayer({
    dataSourceId: datasource.id,
    getFrameData: (rec: any) => rec.img,
    getTimestamp: (rec: any) => rec.timestamp
  })

  /*const videoView = new VideoView({
    container: videoDivId.value,
    // css: "video-h264",
    // name: props.videoTitle,
    showTime: true,
    showStats: true,
    // useWebCodecApi: true,
    width: 480,
    height: 360,
    layers: [videolayer]
  });*/

  const videoView = new MJPEGView({
    container: videoDivId.value,
    css: 'video-h264',
    name: props.videoTitle,
    showTime: props.showTime,
    showStats: props.showStats,
    useWebCodecApi: true,
    width: 480,
    height: 360,
    layers: [videolayer]
  })
  // NOTE: The width and height parameters are disregarded in the standard OSH-JS.
  // If yours is not working, you may have to modify the source code of the VideoView class.
  // And you may need to modify WebCodecView, FFMPEGView, etc.

  datasource.connect()

  // to find video canvas
  /*  let canvases = document.getElementById(videoDivId.value)?.getElementsByTagName("canvas")
    videoCanvas.value = canvases[0] as HTMLCanvasElement;
    console.log('[VideoVue] Video canvas element:', videoCanvas.value);
    videoCanvas.value.classList.add("test-canvas-class");
    videoCanvas.value.style.width = "480px";*/
}

onMounted(() => {
  let dsInstance: any = new SweApi('video-datasource', {
    endpointUrl: props.datasource.endpointUrl,
    resource: props.datasource.resource,
    tls: props.datasource.tls,
    protocol: props.datasource.protocol,
    startTime: props.datasource.startTime,
    endTime: props.datasource.endTime,
    mode: props.datasource.mode,
    responseFormat: props.datasource.responseFormat
  })

  let videolayer = new VideoDataLayer({
    dataSourceId: dsInstance.id,
    getFrameData: props.videoLayer.getFrameData,
    getTimestamp: props.videoLayer.getTimestamp
  })

  let videoView: any = null
  if (props.videoView.videoType !== 'MJPEG') {
    videoView = new VideoView({
      container: videoDivId.value,
      css: 'video-h264',
      name: props.visualization.name,
      showTime: props.videoView.showTime,
      showStats: props.videoView.showStats,
      useWebCodecApi: true,
      width: videoWidth.value,
      height: videoHeight.value,
      layers: [videolayer]
    })
  } else {
    videoView = new MJPEGView({
      container: videoDivId.value,
      css: 'video-h264',
      name: props.visualization.name,
      showTime: props.videoView.showTime,
      showStats: props.videoView.showStats,
      useWebCodecApi: true,
      width: videoWidth.value,
      height: videoHeight.value,
      layers: [videolayer]
    })
  }

  console.log('[VideoVue] Video visualizations info', dsInstance, videolayer, videoView)

  // TODO: check videoView type and create appropriate view
  dsInstance.connect()
});

</script>

<template>

  <v-card :id="videoDivId" class="video-container pa-4"
    :style="{ width: videoWidth + 'px', height: videoHeight + 'px' }">
    <v-card-title class="text-h5 text-center">{{ props.visualization.name || props.videoTitle }}</v-card-title>
    <!-- Video content will be rendered here -->
  </v-card>
  <PTZTaskingComponent />
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