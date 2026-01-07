<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const emit = defineEmits(['update:videoFormat']);

const videoFormatOptions = [
  { title: 'MJPEG', value: 'MJPEG' },
  { title: 'H.264', value: 'H264' },
]

const videoFormat = ref<string>('MJPEG');


watch(videoFormat, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ videoFormat: val });
});


onMounted(() => {
	vwStore.updateVisualizationCustomizationOptions({ videoFormat: videoFormat.value });
});
</script>

<template>
	<v-card class="pa-4" elevation="2">
		<v-card class="pa-4" elevation="2">
      <v-select
          v-model="videoFormat"
          :items="videoFormatOptions"
          label="Video Format"
          variant="outlined"
          density="comfortable"
      ></v-select>
		</v-card>
	</v-card>
</template>
