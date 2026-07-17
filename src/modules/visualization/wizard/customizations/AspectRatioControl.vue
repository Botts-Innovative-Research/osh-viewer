<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const emit = defineEmits(['update:aspectRatio']);

const aspectRatioOptions = [
	{ title: '1:1', value: 1 },
	{ title: '4:3', value: 4 / 3 },
	{ title: '3:2', value: 3 / 2 },
	{ title: '16:10', value: 16 / 10 },
	{ title: '16:9', value: 16 / 9 },
	{ title: '21:9', value: 21 / 9 },
];

const aspectRatio = ref<number>(16 / 9);

watch(aspectRatio, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ aspectRatio: val });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.aspectRatio) {
		vwStore.updateVisualizationCustomizationOptions({ aspectRatio: aspectRatio.value });
	} else {
		aspectRatio.value = vwStore.visualizationCustomizationOptions.aspectRatio;
	}
});
</script>

<template>
	<h3>Aspect Ratio</h3>
	<v-select
		v-model="aspectRatio"
		:items="aspectRatioOptions"
		label="Aspect Ratio"
		variant="outlined"
		density="comfortable"
		hide-details
	></v-select>
</template>
