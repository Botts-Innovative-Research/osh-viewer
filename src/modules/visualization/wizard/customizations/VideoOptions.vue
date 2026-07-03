<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();

const stats = ref<boolean>(false);
const time = ref<boolean>(false);

watch(stats, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ stats: val });
});

watch(time, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ time: val });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.stats === undefined) {
		vwStore.updateVisualizationCustomizationOptions({
			stats: stats.value,
		});
	} else {
		stats.value = vwStore.visualizationCustomizationOptions.stats;
	}

	if (!vwStore.visualizationCustomizationOptions.time === undefined) {
		vwStore.updateVisualizationCustomizationOptions({
			time: time.value,
		});
	} else {
		time.value = vwStore.visualizationCustomizationOptions.time;
	}
});
</script>

<template>
	<v-checkbox
		v-model="stats"
		label="Show Video Stats"
		hide-details
	/>
	<v-checkbox
		v-model="time"
		label="Show Video Time"
		hide-details
	/>
</template>
