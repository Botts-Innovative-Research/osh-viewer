<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = defineProps<{
	roleName: string; // Name to store in the vizwizstore
	label: string; // Label to display above input
	lineId?: string; // Used to identify which line's color is being customized, if multiple lines are present
	defaultColor?: string; // Default color to use if no color is set in the store
}>();

const vwStore = useVizWizStore();
const color = ref<string>(props.defaultColor ?? '#ff0000');
const lineId = computed(() => props.lineId ?? undefined); // Default to 'lineColor' if no lineId is provided

watch(color, (val) => {
	if (!lineId.value) vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: val });
	else {
		const existing = vwStore.visualizationCustomizationOptions[props.roleName];

		vwStore.updateVisualizationCustomizationOptions({
			[props.roleName]: {
				...(typeof existing === 'object' && existing !== null ? existing : {}),
				[lineId.value]: val,
			},
		});
	}
});

onMounted(() => {
	// Initialize color in store if not already set
	if (!vwStore.visualizationCustomizationOptions[props.roleName]) {
		// For items without line ID (e.g. lob)
		if (!lineId.value) {
			vwStore.updateVisualizationCustomizationOptions({
				[props.roleName]: color.value,
			});
		} else {
			vwStore.updateVisualizationCustomizationOptions({
				[props.roleName]: {
					[lineId.value]: color.value,
				},
			});
		}
	}
	// Set local color based on store value
	else {
		if (!lineId.value) {
			color.value = vwStore.visualizationCustomizationOptions[props.roleName];
		} else if (vwStore.visualizationCustomizationOptions[props.roleName][lineId.value]) {
			color.value = vwStore.visualizationCustomizationOptions[props.roleName][lineId.value];
		}
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
