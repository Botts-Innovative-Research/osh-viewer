<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();
const iconColor = ref<string>('#ff0000');

watch(iconColor, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ iconColor: val });
});

onMounted(() => {
	// Initialize icon color in store if not already set
	if (!vwStore.visualizationCustomizationOptions.iconColor) {
		vwStore.updateVisualizationCustomizationOptions({
			iconColor: iconColor.value,
		});
	} else {
		iconColor.value = vwStore.visualizationCustomizationOptions.iconColor;
	}
});
</script>
<template>
	<h3 class="pb-2">Icon Color</h3>
	<v-color-picker
		style="margin: auto"
		v-model="iconColor"
		mode="rgba"
	>
	</v-color-picker>
</template>
