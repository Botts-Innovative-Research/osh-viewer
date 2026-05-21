<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = withDefaults(
	defineProps<{
		roleName?: string; // Optional prop to specify which role this control is customizing (e.g. 'iconColor', etc.). Defaults to 'color' if not provided.
		label?: string; // Optional label for the color control, defaults to 'Color'
	}>(),
	{
		roleName: 'color',
		label: 'Color',
	}
);

const vwStore = useVizWizStore();
const color = ref<string>('#ff0000');

watch(color, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: val });
});

onMounted(() => {
	// Initialize color in store if not already set
	if (!vwStore.visualizationCustomizationOptions[props.roleName]) {
		vwStore.updateVisualizationCustomizationOptions({
			[props.roleName]: color.value,
		});
	} else {
		color.value = vwStore.visualizationCustomizationOptions[props.roleName];
	}
});
</script>
<template>
	<h3 class="pb-2">{{ props.label }}</h3>
	<v-color-picker
		style="margin: auto"
		v-model="color"
		mode="rgba"
	>
	</v-color-picker>
</template>
