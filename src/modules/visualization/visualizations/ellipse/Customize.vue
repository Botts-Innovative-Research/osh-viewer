<script setup lang="ts">
import { computed, ref } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vizwizStore = useVizWizStore();
// If ellipseColor selected in Config, don't show line color select
const showColor = computed(() => (vizwizStore.dsConfig.ellipseColor ? false : true));

const openPanels = ref<string[]>(['general', 'ellipse']);

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
					role="position"
					v-model:valid="nameValid"
				/>
			</v-expansion-panel-text>
		</v-expansion-panel>
		<v-expansion-panel
			eager
			title="Ellipse"
			value="ellipse"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showColor">
						<color-control
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
