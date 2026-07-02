<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import AudioSpectrogramVisualizer
    from "osh-js/source/core/ui/view/audio/visualizer/spectrogram/AudioSpectrogramVisualizer";
import AudioView from 'osh-js/source/core/ui/view/audio/AudioView';
import AudioFrequencyChartJsVisualizer from 'osh-js/source/core/ui/view/audio/visualizer/frequency/AudioFrequencyChartJsVisualizer';
import AudioTimeChartJsVisualizer from 'osh-js/source/core/ui/view/audio/visualizer/time/AudioTimeChartJsVisualizer';
import AudioDataLayer from 'osh-js/source/core/ui/layer/AudioDataLayer';
import { IAudioLayerProperties } from '../../types/layers';
import { IAudioViewProperties } from '../../types/views';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: IConSysApiDataSourceProperties[];
	audioDataLayer: IAudioDataLayerProperties[];
	audioView: IAudioViewProperties;
}>();

const audioId = ref(props.visualization.id);
const audioView = ref<any>(null);
const audioLayer = ref<any>(null);
let audioViewInstance = ref<AudioView | null>(null);

onMounted(async () => {
  initializeAudio();
});

// Array of ConSysApi instances for datasources
const dsInstances = ref<(typeof ConSysApi)[]>([]);

 function initializeAudio() {
   const viz = props.visualization;
   if (!viz || viz.type !== 'audio') return;

   const dsArray: IConSysApiDataSourceProperties[] = props.datasource;

    let getSampleRate: any;
   	let getFrameData: any;
   	let getTimestamp: any;

   for (const dsProps of dsArray) {
        const rawDs = toRaw(dsProps);
   		const dsInstance = createDatasource(dsProps);

   		if (rawDs.properties.sampleRate) {
            getSampleRate = {
                dataSourceIds: [dsInstance.id],
                handler: (rec: any) => rec[rawDs.properties.sampleRate.property],
            };
        }
        if (rawDs.properties.samples) {
            getFrameData = {
                dataSourceIds: [dsInstance.id],
                handler: (rec: any) => rec[rawDs.properties.samples.property],
            };
        }
        getTimestamp = {
            dataSourceIds: [dsInstance.id],
            handler: (rec: any) => new Date(rec.time).getTime(),
        };

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

   const layerOpts = props.audioLayer;
   audioLayer.value = new AudioDataLayer({
   		...layerOpts,
   		dataSourceIds: dsInstances.map((ds) => ds.id),
   		...(getSampleRate ? { getSampleRate } : {}),
   		...(getFrameData ? { getFrameData } : {}),
   		...(getTimestamp ? { getTimestamp } : {}),
   	});

   audioViewInstance.addVisualizer(audioSpectrogramVisualizer);
   console.log('[Audio.vue] Audio view created:', audioViewInstance.value);
 }

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
  <v-sheet class="audio-card pa-4">
       <div :id="spectrogram" class="audio-visualizer" style="height: 300px"></div>
  </v-sheet>
</template>

<style scoped>
.audio-card {
  height: auto;
}
</style>
