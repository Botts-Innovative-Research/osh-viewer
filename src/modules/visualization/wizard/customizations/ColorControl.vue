<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = withDefaults(
	defineProps<{
		roleName: string; // Name to store in the vizwizstore
		label: string; // Label to display above input
		hideInputs?: boolean; // Whether to hide the RGBA input fields in the color picker
		defaultColor?: string; // Starting color if none is saved yet
	}>(),
	{
		hideInputs: false,
		defaultColor: '#ff0000',
	}
);

const vwStore = useVizWizStore();
const color = ref<string>(props.defaultColor);

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
	<h3>{{ props.label }}</h3>
	<v-color-picker
		style="margin: auto"
		v-model="color"
		mode="rgba"
		:hide-inputs="props.hideInputs"
	>
	</v-color-picker>
</template>
