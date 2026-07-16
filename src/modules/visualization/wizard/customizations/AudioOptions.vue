<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../composables/useComponentValidation';

const vwStore = useVizWizStore();

const spectrogram = ref<boolean>(false);
const chartTime = ref<boolean>(false);
const chartFreq = ref<boolean>(false);

watch(spectrogram, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ spectrogram: val });
});

watch(chartTime, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ chartTime: val });
});

watch(chartFreq, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ chartFreq: val });
});

onMounted(() => {
	if (vwStore.visualizationCustomizationOptions.spectrogram === undefined) {
		vwStore.updateVisualizationCustomizationOptions({
			spectrogram: spectrogram.value,
		});
	} else {
		spectrogram.value = vwStore.visualizationCustomizationOptions.spectrogram;
	}

	if (!vwStore.visualizationCustomizationOptions.chartTime === undefined) {
		vwStore.updateVisualizationCustomizationOptions({
			chartTime: chartTime.value,
		});
	} else {
		chartTime.value = vwStore.visualizationCustomizationOptions.chartTime;
	}

	if (!vwStore.visualizationCustomizationOptions.chartFreq === undefined) {
        vwStore.updateVisualizationCustomizationOptions({
            chartFreq: chartFreq.value,
        });
    } else {
        chartFreq.value = vwStore.visualizationCustomizationOptions.chartFreq;
    }
});

const emit = defineEmits(['update:valid']);
const valid = computed(() => spectrogram.value || chartTime.value || chartFreq.value);
useComponentValidation(valid, emit);
</script>

<template>
    <v-checkbox
        v-model="spectrogram"
        label="Show Spectrogram"
        hide-details
    />
	<v-checkbox
		v-model="chartTime"
		label="Show Time Chart"
		hide-details
	/>
	<v-checkbox
		v-model="chartFreq"
		label="Show Frequency Chart"
		hide-details
	/>
</template>
