<script setup lang="ts">
import { watch, ref, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const props = defineProps<{
	roleName: string; // Name to store in the vizwizstore
	label: string; // Label to display above input
	min: number; // Minimum value for the slider
	max: number; // Maximum value for the slider
	step: number; // Step value for the slider
	defaultValue: number; // Default value for the slider
	units?: string; // Optional units to display next to the value
	formatter?: (value: number) => string; // Optional formatter function for displaying the value
}>();

const vwStore = useVizWizStore();
const sliderValue = ref<number>(props.defaultValue);

watch(sliderValue, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: val });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions[props.roleName]) {
		vwStore.updateVisualizationCustomizationOptions({
			[props.roleName]: sliderValue.value,
		});
	} else {
		sliderValue.value = vwStore.visualizationCustomizationOptions[props.roleName];
	}
});
</script>
<template>
	<h3>{{ `${props.label}${props.units ? ` (${props.units})` : ''}` }}</h3>
	<v-slider
		v-model="sliderValue"
		:min="props.min"
		:max="props.max"
		:step="props.step"
	>
		<template v-slot:append>
			<span v-if="props.formatter">{{ props.formatter(sliderValue) }}</span>
			<span v-else>{{ `${sliderValue}${props.units ? ` ${props.units}` : ''}` }}</span>
		</template>
	</v-slider>
</template>
