<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import LineColorControl from '@/modules/visualization/wizard/customizations/LineColorControl.vue';
import WeightControl from '@/modules/visualization/wizard/customizations/WeightControl.vue';
import OpacityControl from '@/modules/visualization/wizard/customizations/OpacityControl.vue';
import DistanceKmControl from '@/modules/visualization/wizard/customizations/DistanceKmControl.vue';

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
	<!-- POINTMARKER -->
	<v-divider class="ma-2">Point Marker Customizations</v-divider>
	<icon-control></icon-control>
	<ColorControl
		roleName="iconColor"
		label="Point Marker Icon Color"
	></ColorControl>
	<!-- LOB -->
	<v-divider class="ma-2">Line of Bearing Customizations</v-divider>
	<icon-control></icon-control>
	<v-row class="justify-space-between pa-4">
		<v-col cols="auto">
			<color-control
				roleName="iconColor"
				label="LoB Icon Color"
			></color-control>
		</v-col>
		<v-col cols="auto">
			<line-color-control></line-color-control>
		</v-col>
	</v-row>
	<weight-control></weight-control>
	<opacity-control></opacity-control>
	<distance-km-control></distance-km-control>
	<!-- ELLIPSE -->
	<v-divider class="ma-2">Ellipse Customizations</v-divider>
	<ColorControl
		roleName="color"
		lable="Color"
	/>
</template>
