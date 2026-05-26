<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import LineColorControl from '@/modules/visualization/wizard/customizations/LineColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';

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
	<!-- POINTMARKER -->
	<v-divider class="ma-2">Point Marker Customizations</v-divider>
	<icon-control></icon-control>
	<color-control
		roleName="pmIconColor"
		label="Point Marker Icon Color"
	></color-control>
	<!-- LOB -->
	<v-divider class="ma-2">Line of Bearing Customizations</v-divider>
	<icon-control></icon-control>
	<v-row class="justify-space-between pa-4">
		<v-col cols="auto">
			<color-control
				roleName="lobIconColor"
				label="LoB Icon Color"
			></color-control>
		</v-col>
		<v-col cols="auto">
			<line-color-control></line-color-control>
		</v-col>
	</v-row>
	<slider-value-control
		roleName="lobWeight"
		label="LoB Line Weight"
		:min="1"
		:max="20"
		:step="0.5"
		:defaultValue="10"
		units=""
	></slider-value-control>
	<slider-value-control
		roleName="lobOpacity"
		label="LoB Line Opacity"
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
	<SliderValueControl
		roleName="lobDistanceKm"
		label="LoB Line Distance"
		:min="0"
		:max="100"
		:step="0.1"
		:defaultValue="1"
		units="km"
	></SliderValueControl>
	<!-- ELLIPSE -->
	<v-divider class="ma-2">Ellipse Customizations</v-divider>
	<ColorControl
		roleName="ellipseColor"
		label="Color"
	/>
</template>
