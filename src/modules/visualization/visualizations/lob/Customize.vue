<script setup lang="ts">
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import SliderValueControl from '../../wizard/customizations/SliderValueControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { computed, ref } from 'vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import IconVisibilityControl from '@/modules/visualization/wizard/customizations/IconVisibilityControl.vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vizwizStore = useVizWizStore();
const showIcon = computed(() => vizwizStore.visualizationCustomizationOptions.showIcon ?? true);

const openPanels = ref<string[]>(['general', 'icon', 'line']);

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
				<name-control
					role="origin"
					v-model:valid="nameValid"
				></name-control>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			title="Icon"
			value="icon"
		>
			<v-expansion-panel-text>
				<icon-visibility-control
					roleName="showIcon"
					label="Show Icon"
				></icon-visibility-control>
				<v-expand-transition>
					<div v-if="showIcon">
						<icon-control roleName="icon"></icon-control>
						<color-control
							roleName="iconColor"
							label="Icon Color"
						></color-control>
					</div>
					<div v-else>
						<i class="text--disabled">
							Icon is hidden. Enable "Show Icon" to customize.
						</i>
					</div>
				</v-expand-transition>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			title="Line"
			value="line"
		>
			<v-expansion-panel-text>
				<color-control
					roleName="lineColor"
					label="Line Color"
				></color-control>
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
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>
