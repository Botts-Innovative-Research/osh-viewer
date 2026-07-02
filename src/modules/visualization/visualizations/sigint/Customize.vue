<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '@/modules/visualization/registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '@/modules/visualization/wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '@/modules/visualization/wizard/composables/useComponentValidation';
import SliderValueControl from '@/modules/visualization/wizard/customizations/SliderValueControl.vue';
import { useVizWizStore } from '@/stores/vizwizstore';
import { confirmRoles } from '../../registry/roleUtils';
import { EllipseConfigRoles } from '../ellipse/Descriptor';

const vizwizStore = useVizWizStore();
// POINTMARKER
// If milSymbol is selected in PM Config, add alert to icon customize
const showPmIcon = computed(() => (vizwizStore.dsConfig.milSymbol ? false : true));
const showPmIconColor = computed(() =>
	vizwizStore.dsConfig.pmIconColor || vizwizStore.dsConfig.milSymbol ? false : true
);
// LOB
const showLobLineColor = computed(() => (vizwizStore.dsConfig.lobLineColor ? false : true));
// ELLIPSE
const showEllipseColor = computed(() => (vizwizStore.dsConfig.ellipseColor ? false : true));

const openPanels = ref<string[]>(['general', 'pointmarker', 'lob', 'ellipse']);

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
			title="Point Marker Customizations"
			value="pointmarker"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showPmIcon">
						<icon-control roleName="pmIcon"></icon-control>
					</div>
					<div
						v-else
						class="pa-4"
					>
						<v-alert variant="outlined"
							>Icon will be dynamically generated with the respective military symbol
							based on the selected properties from the previous step.</v-alert
						>
					</div>
				</v-expand-transition>
				<v-expand-transition>
					<div v-if="showPmIconColor">
						<color-control
							roleName="pmIconColor"
							label="Point Marker Icon Color"
						></color-control>
					</div>
					<div
						v-else
						class="pa-4"
					>
						<v-alert variant="outlined"
							>Icon color will be dynamically generated based on the selected
							properties from the previous step.</v-alert
						>
					</div>
				</v-expand-transition>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			title="Line of Bearing Customizations"
			value="lob"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showLobLineColor">
						<color-control
							roleName="lobLineColor"
							label="LoB Line Color"
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
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			title="Ellipse Customizations"
			value="ellipse"
			v-show="confirmRoles(EllipseConfigRoles, vizwizStore.dsConfig, vizwizStore.csConfig)"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showEllipseColor">
						<ColorControl
							roleName="ellipseColor"
							label="Color"
						/>
					</div>
					<div
						v-else
						class="pb-4"
					>
						<v-alert variant="outlined"
							>Ellipse color will be dynamically generated based on the selected
							properties from the previous step.</v-alert
						>
					</div>
				</v-expand-transition>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>
