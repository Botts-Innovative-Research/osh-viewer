<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const opacity = ref<number>(0.5);

watch(opacity, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ opacity: val });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.opacity) {
		vwStore.updateVisualizationCustomizationOptions({
			opacity: opacity.value,
		});
	} else {
		opacity.value = vwStore.visualizationCustomizationOptions.opacity;
	}
});
</script>
<template>
	<h3>Opacity</h3>
	<v-slider
		v-model="opacity"
		:min="0"
		:max="1"
		step="0.01"
	>
		<template v-slot:append>
			<span>{{ (opacity * 100).toFixed(0) }}%</span>
		</template>
	</v-slider>
</template>
