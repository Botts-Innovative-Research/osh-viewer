<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const valid = computed(() => {
	return nameValid.value;
});
useComponentValidation(valid, emit);
</script>

<template>
	<NameControl
		role="location"
		v-model:valid="nameValid"
	/>
	<color-control
		roleName="color"
		label="Color"
	></color-control>
	<slider-value-control
		roleName="weight"
		label="Weight"
		:min="1"
		:max="20"
		:step="0.5"
		:defaultValue="10"
		units=""
	></slider-value-control>
	<slider-value-control
		roleName="opacity"
		label="Opacity"
		:min="0"
		:max="1"
		:step="0.01"
		:defaultValue="0.5"
		units="%"
		:formatter="
			(value: number) => {
				return `${(value * 100).toFixed(0)}%`;
			}
		"
	></slider-value-control>
</template>
