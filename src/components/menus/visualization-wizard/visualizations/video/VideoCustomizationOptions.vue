<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const emit = defineEmits(['update:videoFormat']);

const videoFormatOptions = [
  { title: 'H.264', value: 'H264' },
  { title: 'MJPEG', value: 'MJPEG' },
]

const videoFormat = ref<string>('H264');


watch(videoFormat, (val) => {
	vwStore.updateVisualizationCustomizationOptions({});
});


onMounted(() => {
	vwStore.updateVisualizationCustomizationOptions({
	});
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
