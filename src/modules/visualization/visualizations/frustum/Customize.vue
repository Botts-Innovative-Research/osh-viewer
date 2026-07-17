<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';
import NumberControl from '../../wizard/customizations/NumberControl.vue';
import IDColorControl from '@/modules/visualization/wizard/customizations/IDColorControl.vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const openPanels = ref<string[]>(['general', 'frustum', 'appearance']);
// Set default border color to #FFFFFF
if (!useVizWizStore().visualizationCustomizationOptions.borderColor)
	useVizWizStore().visualizationCustomizationOptions.borderColor = '#FFFFFF';

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const fovValid = ref<boolean>(false);
const valid = computed(() => {
	return nameValid.value && fovValid.value;
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
					role="origin"
					v-model:valid="nameValid"
				/>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			value="frustum"
		>
			<v-expansion-panel-title>
				Frustum
				<template
					v-slot:actions
					v-if="!fovValid"
				>
					<v-icon
						color="error"
						icon="mdi-alert-circle"
					>
					</v-icon>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<SliderValueControl
					roleName="range"
					label="Range"
					:min="0"
					:max="1000"
					:step="1"
					:defaultValue="100"
					units="m"
				></SliderValueControl>
				<NumberControl
					roleName="fov"
					label="FOV"
					:min="1"
					:max="179"
					:step="1"
					:defaultValue="60"
					units="deg"
					v-model:valid="fovValid"
				></NumberControl>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			value="appearance"
			title="Appearance"
		>
			<v-expansion-panel-text>
				<v-row class="justify-space-between pa-4">
					<v-col cols="auto">
						<color-control
							roleName="color"
							label="Color"
						></color-control>
					</v-col>
					<v-col cols="auto">
						<color-control
							roleName="borderColor"
							label="Border Color"
						></color-control>
					</v-col>
				</v-row>
				<SliderValueControl
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
				></SliderValueControl>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>
