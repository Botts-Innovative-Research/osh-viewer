<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../composables/useComponentValidation';

const props = defineProps<{
	roleName: string; // Name to store in the vizwizstore
	label: string; // Label to display above input
	min: number; // Minimum value for the input
	max: number; // Maximum value for the input
	step: number; // Step value for the input
	defaultValue: number; // Default value for the input
	units?: string; // Optional units to display next to the value
	formatter?: (value: number) => string; // Optional formatter function for displaying the value
}>();

const vwStore = useVizWizStore();
const numValue = ref<number>(props.defaultValue);

watch(numValue, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ [props.roleName]: val });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions[props.roleName]) {
		vwStore.updateVisualizationCustomizationOptions({
			[props.roleName]: numValue.value,
		});
	} else {
		numValue.value = vwStore.visualizationCustomizationOptions[props.roleName];
	}
});

// Validation: numVal cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const valid = computed(() => {
	return !!numValue.value;
});
useComponentValidation(valid, emit);
</script>
<template>
	<h3>{{ `${props.label}${props.units ? ` (${props.units})` : ''}` }}</h3>
	<v-number-input
		v-model="numValue"
		:label="props.label"
		:min="props.min"
		:max="props.max"
		:rules="[() => !!numValue || `${props.label} is required.`]"
		variant="outlined"
		:hint="`Min: ${props.min} | Max: ${props.max}`"
	>
	</v-number-input>
</template>
