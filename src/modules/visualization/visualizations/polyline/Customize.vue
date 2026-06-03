<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';

const openPanels = ref<string[]>(['general', 'line']);

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const valid = computed(() => {
	return nameValid.value;
});
useComponentValidation(valid, emit);
</script>

<template>
	<v-expansion-panels
		rounded="lg"
		static
		multiple
		v-model="openPanels"
	>
		<v-expansion-panel
			eager
			value="general"
		>
			<v-expansion-panel-title>
				General
				<template
					v-slot:actions
					v-if="!nameValid"
				>
					<v-icon
						color="error"
						icon="mdi-alert-circle"
					>
					</v-icon>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<NameControl
					role="location"
					v-model:valid="nameValid"
				/>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			title="Line"
			value="line"
		>
			<v-expansion-panel-text>
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
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>
