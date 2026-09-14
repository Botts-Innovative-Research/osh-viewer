<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { useVizWizStore } from '@/stores/vizwizstore';

const vizwizStore = useVizWizStore();
// If polylineColor selected in Config, don't show line color select
const showLineColor = computed(() => (vizwizStore.dsConfig.polylineColor ? false : true));

const openPanels = ref<string[]>(['general', 'line']);

const maxPoints = ref<number>(200);

watch(maxPoints, (val) => {
	vizwizStore.updateVisualizationCustomizationOptions({ maxPoints: val });
});

onMounted(() => {
	if (!vizwizStore.visualizationCustomizationOptions['maxPoints']) {
		vizwizStore.updateVisualizationCustomizationOptions({ maxPoints: maxPoints.value });
	} else {
		maxPoints.value = vizwizStore.visualizationCustomizationOptions['maxPoints'];
	}
});

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
				<v-expand-transition>
					<div v-if="showLineColor">
						<color-control
							roleName="color"
							label="Color"
						></color-control>
					</div>
					<div
						v-else
						class="pb-4"
					>
						<v-alert variant="outlined"
							>Line color will be dynamically generated based on the selected
							properties from the previous step.</v-alert
						>
					</div>
				</v-expand-transition>
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

				<v-text-field
					v-model.number="maxPoints"
					type="number"
					label="Max Points"
					:rules="[
						(v: number) => v >= 1 || 'Must be at least 1',
						(v: number) => v <= 10000 || 'Must be at most 10,000',
					]"
					min="1"
					max="10000"
					hint="Number of points to display (1 - 10,000)"
					persistent-hint
				></v-text-field>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>
