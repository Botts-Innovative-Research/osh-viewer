<script setup lang="ts">
import { ref, computed } from 'vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import NameControl from '@/modules/visualization/wizard/customizations/NameControl.vue';
import IconControl from '@/modules/visualization/wizard/customizations/IconControl.vue';
import ColorControl from '../../wizard/customizations/ColorControl.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { useVizWizStore } from '@/stores/vizwizstore';

const vizwizStore = useVizWizStore();

const openPanels = ref<string[]>(['general', 'homeMarker', 'locationMarker']);

// Show/hide logic for home marker
const showHomeIcon = computed(() => !vizwizStore.dsConfig.milSymbol);
const showHomeIconColor = computed(
	() => !(vizwizStore.dsConfig.pmIconColor || vizwizStore.dsConfig.milSymbol)
);

// Show/hide logic for location marker
const showLocationIcon = computed(() => !vizwizStore.dsConfig.milSymbol);
const showLocationIconColor = computed(
	() => !(vizwizStore.dsConfig.pmIconColor || vizwizStore.dsConfig.milSymbol)
);

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
					default-name="New Mission Builder"
					v-model:valid="nameValid"
				></NameControl>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel
			v-if="vizwizStore.dsConfig.homeLocation?.selected"
			eager
			title="Home Marker"
			value="homeMarker"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showHomeIcon">
						<IconControl roleName="homeIcon" />
					</div>
					<div v-else class="pa-4">
						<v-alert variant="outlined">
							Icon will be dynamically generated with the respective military symbol
							based on the selected properties from the previous step.
						</v-alert>
					</div>
				</v-expand-transition>
				<v-expand-transition>
<!--					<div v-if="showHomeIconColor">-->
<!--						<ColorControl-->
<!--							roleName="homeIconColor"-->
<!--							label="Home Icon Color"-->
<!--						/>-->
<!--					</div>-->
					<div class="pa-4">
						<v-alert variant="outlined">
							Icon color will be dynamically generated based on the selected
							properties from the previous step.
						</v-alert>
					</div>
				</v-expand-transition>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel
			v-if="vizwizStore.dsConfig.location?.selected"
			eager
			title="Vehicle Marker"
			value="locationMarker"
		>
			<v-expansion-panel-text>
				<v-expand-transition>
					<div v-if="showLocationIcon">
						<IconControl roleName="locationIcon" />
					</div>
					<div v-else class="pa-4">
						<v-alert variant="outlined">
							Icon will be dynamically generated with the respective military symbol
							based on the selected properties from the previous step.
						</v-alert>
					</div>
				</v-expand-transition>
				<v-expand-transition>
<!--					<div v-if="showLocationIconColor">-->
<!--						<ColorControl-->
<!--							roleName="locationIconColor"-->
<!--							label="Vehicle Icon Color"-->
<!--						/>-->
<!--					</div>-->
					<div class="pa-4">
						<v-alert variant="outlined">
							Icon color will be dynamically generated based on the selected
							properties from the previous step.
						</v-alert>
					</div>
				</v-expand-transition>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>
