<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import MilSymbolControl from '@/modules/visualization/wizard/customizations/MilSymbolControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { useVizWizStore } from '@/stores/vizwizstore';

const vizwizStore = useVizWizStore();
const useMilSymbol = ref<boolean>(!!vizwizStore.visualizationCustomizationOptions.useMilSymbol);
// If pmIconColor or milSymbol selected in Config, don't show icon color select
const showIconColor = computed(() =>
    vizwizStore.dsConfig.pmIconColor || vizwizStore.dsConfig.milSymbol || useMilSymbol.value
        ? false
        : true
);

const showManualMilSymbol = computed(() => !vizwizStore.dsConfig.milSymbol);
const showMilSymbolSelect = computed(() => showManualMilSymbol.value && useMilSymbol.value);
// If milSymbol is selected in Config or milSymbol select is showing, don't show icon select
const showIcon = computed(() =>
	vizwizStore.dsConfig.milSymbol || showMilSymbolSelect.value ? false : true
);
const openPanels = ref<string[]>(['general', 'pointmarker', 'label']);

const options = computed(() => vizwizStore.visualizationCustomizationOptions);

const labelText = computed({
	get: () => options.value.labelText ?? '',
	set: (val: string) => vizwizStore.updateVisualizationCustomizationOptions({ labelText: val }),
});

const labelSize = computed({
	get: () => options.value.labelSize ?? 16,
	set: (val: number) => vizwizStore.updateVisualizationCustomizationOptions({ labelSize: val }),
});

const labelPosition = computed({
	get: () => options.value.labelPosition ?? 'above',
	set: (val: string) =>
		vizwizStore.updateVisualizationCustomizationOptions({ labelPosition: val }),
});

const labelPositions = [
	{ title: 'Above', value: 'above' },
	{ title: 'Below', value: 'below' },
	{ title: 'Left', value: 'left' },
	{ title: 'Right', value: 'right' },
];

const showOutline = ref<boolean>(!!options.value.labelOutlineColor);
const showBackground = ref<boolean>(!!options.value.labelBackgroundColor);

function onShowOutlineChange(val: boolean | null) {
	showOutline.value = !!val;
	if (!val) vizwizStore.updateVisualizationCustomizationOptions({ labelOutlineColor: '' });
}

function onShowBackgroundChange(val: boolean | null) {
	showBackground.value = !!val;
	if (!val) vizwizStore.updateVisualizationCustomizationOptions({ labelBackgroundColor: '' });
}

const labelFromData = computed(() => !!vizwizStore.dsConfig.pmLabel);

function onUseMilSymbolChange(val: boolean | null) {
    useMilSymbol.value = !!val;

    vizwizStore.updateVisualizationCustomizationOptions({
   		useMilSymbol: useMilSymbol.value,
   		// Unchecking clears the chosen symbol
   		...(useMilSymbol.value ? {} : { milSymbol: '' }),
   	});

}

// Validation: Name cannot be empty
const emit = defineEmits<VisualizationComponentEmits>();
const nameValid = ref<boolean>(false);
const milSymbolValid = computed(
    () => !showMilSymbolSelect.value || !!vizwizStore.visualizationCustomizationOptions.milSymbol
);
const valid = computed(() => {
    return nameValid.value && milSymbolValid.value;
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
			value="pointmarker"
		>
			<v-expansion-panel-title>
				Point Marker
				<template
					v-slot:actions
					v-if="!milSymbolValid"
				>
					<v-icon
						color="error"
						icon="mdi-alert-circle"
					>
					</v-icon>
				</template>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<v-checkbox
					v-if="showManualMilSymbol"
					:model-value="useMilSymbol"
					label="Use Military Symbol Icon"
					class="ms-n2"
					hide-details
					@update:model-value="onUseMilSymbolChange"
				></v-checkbox>
				<v-expand-transition>
					<div v-if="showMilSymbolSelect">
						<MilSymbolControl />
					</div>
				</v-expand-transition>
				<v-expand-transition>
					<div v-if="showIcon">
						<icon-control roleName="icon"></icon-control>
					</div>
					<!-- CHANGED: Only show when milSymbol comes from Config -->
					<div
						v-else-if="!showMilSymbolSelect"
						class="pa-4"
					>
						<v-alert variant="outlined"
							>Icon will be dynamically generated with the respective military symbol
							based on the selected properties from the previous step.</v-alert
						>
					</div>
				</v-expand-transition>
				<v-expand-transition>
					<div v-if="showIconColor">
						<color-control
							roleName="iconColor"
							label="Icon Color"
						></color-control>
					</div>
					<div
						v-else-if="!showMilSymbolSelect"
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
        			value="label"
        		>
        			<v-expansion-panel-title>Label</v-expansion-panel-title>
        			<v-expansion-panel-text>
        				<v-alert
        					v-if="labelFromData"
        					variant="outlined"
        					class="mb-4"
        				>
        					The label text comes from the data field selected in the previous step.
        					The style settings below still apply.
        				</v-alert>
        				<v-text-field
        					v-else
        					v-model="labelText"
        					label="Label Text"
        					placeholder="Defaults to the visualization name"
        					clearable
        				></v-text-field>

        				<v-slider
        					v-model="labelSize"
        					label="Text Size"
        					:min="8"
        					:max="40"
        					:step="1"
        					thumb-label
        				></v-slider>

        				<v-select
        					v-model="labelPosition"
        					:items="labelPositions"
        					label="Position"
        				></v-select>

        				<color-control
        					roleName="labelColor"
        					label="Text Color"
        					defaultColor="#FFFFFF"
        				></color-control>

        				<v-checkbox
        					:model-value="showOutline"
        					label="Text Outline"
        					hide-details
        					@update:model-value="onShowOutlineChange"
        				></v-checkbox>
        				<v-expand-transition>
        					<div v-if="showOutline">
        						<color-control
        							roleName="labelOutlineColor"
        							label="Outline Color"
        							defaultColor="#000000"
        						></color-control>
        					</div>
        				</v-expand-transition>

        				<v-checkbox
        					:model-value="showBackground"
        					label="Background Box"
        					hide-details
        					@update:model-value="onShowBackgroundChange"
        				></v-checkbox>
        				<v-expand-transition>
        					<div v-if="showBackground">
        						<color-control
        							roleName="labelBackgroundColor"
        							label="Background Color"
        							defaultColor="#333333"
        						></color-control>
        					</div>
        				</v-expand-transition>

        				<v-alert
        					variant="tonal"
        					density="compact"
        					class="mt-4"
        				>
        					Label styling appears on the 3D (Cesium) map.
        				</v-alert>
        			</v-expansion-panel-text>
        		</v-expansion-panel>
	</v-expansion-panels>
</template>
