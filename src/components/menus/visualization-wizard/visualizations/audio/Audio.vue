<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { createDatasource, useVisualizationCleanup } from '../../shared/helpers';
import { IChartViewProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import AudioView from "osh-js/source/core/ui/view/audio/AudioView";
import AudioSpectrogramVisualizer from "osh-js/source/core/ui/view/audio/visualizer/spectrogram/AudioSpectrogramVisualizer";

const props = defineProps<{
  visualization: OSHVisualization,
  datasource: ISweApiDataSourceProperties[],
  audioView: IChartViewProperties,
  spectrogramOptions?: { fftSize?: number, sampleField?: string, colorScale?: string },
  audioViewOptions?: Record<string, any>,
}>();

const audioId = ref('audio-' + randomUUID());
let audioViewInstance = ref<AudioView | null>(null);
onMounted(async () => {
  initializeAudio();
});

// Array of SweApi instances for datasources
const dsInstances: SweApi[] = [];

function initializeAudio() {
  const viz = props.visualization;
  if (!viz || viz.type !== 'audio') return;

  const dsArray: ISweApiDataSourceProperties[] = props.datasource

  for (const dsProps of dsArray) {
    let rawDs = toRaw(dsProps);

    const dsInstance = createDatasource(dsProps)

    dsInstance.connect();
    dsInstances.push(dsInstance);
    console.log('[Audio.vue] Audio datasource created:', dsInstance);
  }

  const audioSpectrogramVisualizer = new AudioSpectrogramVisualizer({
     ...props.spectrogramOptions,
     fftSize: props.spectrogramOptions?.fftSize || 2048,
     container: audioId.value,
  });

  if (audioViewInstance.value) {
    audioViewInstance.value.destroy?.();
    audioViewInstance.value = null;
  }
  audioViewInstance.value = new AudioView({
         ...props.audioViewOptions,
         container: audioId.value,
         dataSource: dsInstances[0],
         playSound: false
  });
  audioViewInstance.value.addVisualizer(audioSpectrogramVisualizer);
  console.log('[Audio.vue] Audio view created:', audioViewInstance.value);
}

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
  <v-sheet class="audio-card pa-4">
    <div :id="audioId"></div>
  </v-sheet>
</template>

<style scoped>
.audio-card {
  height: auto;
}
</style>
