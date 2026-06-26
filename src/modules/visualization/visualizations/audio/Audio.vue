<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { createDatasource, useVisualizationCleanup } from '../../shared/helpers';
import { IChartViewProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import AudioSpectrogramVisualizer
    from "osh-js/source/core/ui/view/audio/visualizer/spectrogram/AudioSpectrogramVisualizer";
import AudioView from 'osh-js/source/core/ui/view/audio/AudioView';
import AudioFrequencyChartJsVisualizer from 'osh-js/source/core/ui/view/audio/visualizer/frequency/AudioFrequencyChartJsVisualizer';
import AudioTimeChartJsVisualizer from 'osh-js/source/core/ui/view/audio/visualizer/time/AudioTimeChartJsVisualizer';
import AudioDataLayer from 'osh-js/source/core/ui/layer/AudioDataLayer';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: IConSysApiDataSourceProperties[];
	audioDataLayer: audioDataLayer[];
	audioView: audioView;
}>();

const audioId = ref(props.visualization.id);
let audioViewInstance = ref<AudioView | null>(null);

onMounted(async () => {
  initializeAudio();
});

// Array of SweApi instances for datasources
const dsInstances: ref<(typeof ConSysApi)[]>([]);

 function initializeAudio() {
   const viz = props.visualization;
   if (!viz || viz.type !== 'audio') return;

   const dsArray: IConSysApiDataSourceProperties[] = props.datasource;

   for (const dsProps of dsArray) {
   		const dsInstance = createDatasource(dsProps);

   		dsInstance.connect();
   		dsInstances.value.push(dsInstance);
   		console.log('[Audio.vue] Audio datasource created:', dsInstance);
   	}

   const audioSpectrogramVisualizer = new AudioSpectrogramVisualizer({
        fftSize: 2048,
        container: `spectrogram`,
   });

   audioViewInstance.value = new AudioView({
        ...props.audioViewOptions,
        container: audioId.value,
        dataSource: dsInstances[0],
        playSound: false
   });

   const audioLayer = new AudioDataLayer({
       dataSourceId: audioDataSource.id,
       getSampleRate: (rec: any) => rec.sampleRate,
       getFrameData: (rec: any) => rec.samples,
       getTimestamp: (rec: any) => new Date(rec.time).getTime()
   })

   audioViewInstance.addVisualizer(audioSpectrogramVisualizer);
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
