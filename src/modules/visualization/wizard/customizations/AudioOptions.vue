<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../composables/useComponentValidation';

const vwStore = useVizWizStore();

const spectrogram = ref<boolean>(false);
const chartTime = ref<boolean>(false);
const chartFreq = ref<boolean>(false);


const visualizerOptions = [
	{ title: 'Spectrogram', value: 'spectrogram' },
	{ title: 'Time Chart', value: 'chartTime' },
	{ title: 'Frequency Chart', value: 'chartFreq' },
];

const selectedVisualizer = ref<string>('spectrogram');

function writeSelection(val: string) {
	vwStore.updateVisualizationCustomizationOptions({
		spectrogram: val === 'spectrogram',
		chartTime: val === 'chartTime',
		chartFreq: val === 'chartFreq',
	});
}

watch(selectedVisualizer, (val) => {
	writeSelection(val);
});

onMounted(() => {
	const opts = vwStore.visualizationCustomizationOptions;
	if (opts.spectrogram === undefined && opts.chartTime === undefined && opts.chartFreq === undefined) {
		writeSelection(selectedVisualizer.value);
	} else if (opts.chartTime) {
		selectedVisualizer.value = 'chartTime';
	} else if (opts.chartFreq) {
		selectedVisualizer.value = 'chartFreq';
	} else {
		selectedVisualizer.value = 'spectrogram';
	}
});

const emit = defineEmits(['update:valid']);
const valid = computed(() => !!selectedVisualizer.value);
useComponentValidation(valid, emit);
</script>

<template>
	<v-autocomplete
		v-model="selectedVisualizer"
		:items="visualizerOptions"
		label="Select audio visualization"
		persistent-hint
		item-title="title"
		item-value="value"
	></v-autocomplete>
</template>

<style scoped></style>