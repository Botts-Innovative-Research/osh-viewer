<script setup lang="ts">
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { computed, ref } from 'vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import IconVisibilityControl from '@/modules/visualization/wizard/customizations/IconVisibilityControl.vue';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const valid = computed(() => {
	return nameValid.value;
});
useComponentValidation(valid, emit);
</script>

<template>
	<name-control
		role="origin"
		v-model:valid="nameValid"
	></name-control>
	<icon-visibility-control
		roleName="showIcon"
		label="Show Icon"
	></icon-visibility-control>
	<icon-control roleName="icon"></icon-control>
	<v-row class="justify-space-between pa-4">
		<v-col cols="auto">
			<color-control
				roleName="iconColor"
				label="Icon Color"
			></color-control>
		</v-col>
		<v-col cols="auto">
			<color-control
				roleName="lineColor"
				label="Line Color"
			></color-control>
		</v-col>
	</v-row>
	<slider-value-control
		roleName="lobWeight"
		label="Line Weight"
		:min="1"
		:max="20"
		:step="0.5"
		:defaultValue="10"
		units=""
	></slider-value-control>
	<slider-value-control
		roleName="lobOpacity"
		label="Line Opacity"
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
	<slider-value-control
		roleName="lobDistanceKm"
		label="Line Distance"
		:min="0"
		:max="100"
		:step="0.1"
		:defaultValue="1"
		units="km"
	></slider-value-control>
</template>
