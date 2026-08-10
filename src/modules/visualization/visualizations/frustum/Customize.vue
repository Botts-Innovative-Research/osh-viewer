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
import AspectRatioControl from '@/modules/visualization/wizard/customizations/AspectRatioControl.vue';

const vizwizStore = useVizWizStore();
const openPanels = ref<string[]>(['general', 'frustum', 'appearance']);
// Set default border color to #FFFFFF
if (!vizwizStore.visualizationCustomizationOptions.borderColor)
	vizwizStore.visualizationCustomizationOptions.borderColor = '#FFFFFF';
if (vizwizStore.visualizationCustomizationOptions.is2D === undefined)
	vizwizStore.visualizationCustomizationOptions.is2D = false;

const is2D = computed({
	get: () => vizwizStore.visualizationCustomizationOptions.is2D ?? false,
	set: (val: boolean) => {
		vizwizStore.visualizationCustomizationOptions.is2D = val;
	},
});

const hasDynamicRange = computed(() => !!vizwizStore.dsConfig.range?.selected);
const hasDynamicFov = computed(() => !!vizwizStore.dsConfig.horizontalFOV?.selected);

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const fovValid = ref<boolean>(false);
const valid = computed(() => {
	return nameValid.value && (hasDynamicFov.value || fovValid.value);
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
				<v-switch
					v-model="is2D"
					label="2D Frustum"
					color="primary"
					density="compact"
					hide-details
					class="mb-2"
				/>
				<SliderValueControl
					v-if="!hasDynamicRange"
					roleName="range"
					label="Range"
					:min="0"
					:max="1000"
					:step="1"
					:defaultValue="100"
					units="m"
				></SliderValueControl>
				<v-chip v-else color="primary" variant="tonal" class="mb-2">
					<v-icon start>mdi-database</v-icon>
					Range from datastream
				</v-chip>
				<NumberControl
					v-if="!hasDynamicFov"
					roleName="fov"
					label="FOV"
					:min="1"
					:max="179"
					:step="1"
					:defaultValue="60"
					units="deg"
					v-model:valid="fovValid"
				></NumberControl>
				<v-chip v-else color="primary" variant="tonal" class="mb-2">
					<v-icon start>mdi-database</v-icon>
					FOV from datastream
				</v-chip>
				<AspectRatioControl v-if="!is2D" />
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
