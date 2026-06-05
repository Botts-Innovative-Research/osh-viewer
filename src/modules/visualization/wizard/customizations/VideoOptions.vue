<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();

const stats = ref<boolean>(false);
const time = ref<boolean>(false);
const is360 = ref<boolean>(false);

watch(stats, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ stats: val });
});

watch(time, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ time: val });
})

watch(is360, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ is360: val });
})

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.stats) {
		vwStore.updateVisualizationCustomizationOptions({
			stats: stats.value,
		});
	} else {
		stats.value = vwStore.visualizationCustomizationOptions.stats;
	}

	if (!vwStore.visualizationCustomizationOptions.time) {
		vwStore.updateVisualizationCustomizationOptions({
			time: time.value,
		});
	} else {
		time.value = vwStore.visualizationCustomizationOptions.time;
	}

	if (!vwStore.visualizationCustomizationOptions.is360) {
		vwStore.updateVisualizationCustomizationOptions({
			is360: is360.value,
		});
	} else {
		is360.value = vwStore.visualizationCustomizationOptions.is360;
	}
});
</script>

<template>
	<v-checkbox
		v-model="stats"
		label="Show Video Stats"
	/>
	<v-checkbox
		v-model="time"
		label="Show Video Time"
	/>
	<v-checkbox
		v-model="is360"
		label="Enable 360 View"
	/>
</template>
