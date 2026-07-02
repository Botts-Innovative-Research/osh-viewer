<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { useVizWizStore } from '@/stores/vizwizstore';

const vizwizStore = useVizWizStore();
// If milSymbol is selected in Config, don't show icon select
const showIcon = computed(() => (vizwizStore.dsConfig.milSymbol ? false : true));
// If pmIconColor or milSymbol selected in Config, don't show icon color select
const showIconColor = computed(() =>
	vizwizStore.dsConfig.pmIconColor || vizwizStore.dsConfig.milSymbol ? false : true
);

const openPanels = ref<string[]>(['general', 'pointmarker']);

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
			title="Point Marker"
			value="pointmarker"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showIcon">
						<icon-control roleName="icon"></icon-control>
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
					<div v-if="showIconColor">
						<color-control
							roleName="iconColor"
							label="Icon Color"
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
	</v-expansion-panels>
</template>
