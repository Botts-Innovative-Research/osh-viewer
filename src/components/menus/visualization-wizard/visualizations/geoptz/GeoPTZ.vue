<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useUIStore } from '@/stores/uistore';

const props = defineProps<{
	visualizations: OSHVisualization[],
}>();

// Define PTZ data interface
export interface PTZData {
	pan: number;
	tilt: number;
	zoom: number;
}

export interface GeoPTZCommand {
	parameters: {
		lat: number;
		lon: number;
		alt: number;
	}
}

// Values for LLA inputs
const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(0.0);

const uiStore = useUIStore();
const isSelected = computed(() => uiStore.isGeoPTZSelected);

// Watch for changes in currentLLA to update input fields, IF selected
watch(
	() => uiStore.currentLLA,
	(newVal) => {
		if (isSelected.value && newVal) {
			latInput.value = newVal.latitude;
			lonInput.value = newVal.longitude;
			altInput.value = newVal.altitude;
		}
	}
);

// Update selected GeoPTZ list
watch(
	() => props.visualizations,
	(newVal) => {
		uiStore.setSelectedGeoPTZ(newVal);
	}
)

// Toggle selection of GeoPTZ in UI store and locally
function toggle() {
	if (isSelected.value) {
		uiStore.setIsGeoPTZSelected(false);
	} else {
		uiStore.setIsGeoPTZSelected(true);
		uiStore.setSelectedGeoPTZ(props.visualizations);
	}
}

// Send PTZ command based on LLA inputs
function onSend() {
	// Ensure newly selected controllers are added
	uiStore.setSelectedGeoPTZ(props.visualizations)

	const command: GeoPTZCommand = {
		parameters: {
			lat: latInput.value,
			lon: lonInput.value,
			alt: altInput.value,
		},
	};

	console.log('[GeoPtzView] Sending GeoPTZ command:', command);
	uiStore.sendGeoPTZCommand(command);
}

onBeforeUnmount(() => {
	// Disselect GeoPTZ before unmount
	if (isSelected.value) uiStore.clearSelectedGeoPTZ();
})
</script>

<template>
	<v-container fluid>
		<v-row class="d-flex align-center" no-gutters>
			<v-col class="pr-4" cols="auto">
				<v-tooltip :text="props.visualizations.length === 0 ? 'No GeoPTZ controllers selected' : 'Select map click-to-task'" location="top">
					<template #activator="{ props: tooltipProps }">
						<span v-bind="tooltipProps" style="display: inline-block;">
							<IconButton icon :color="isSelected ? 'primary' : 'grey'" @click="toggle"
								:disabled="props.visualizations.length === 0" class="pa-0" size="default">
								<v-icon>
									{{ isSelected ? 'mdi-check-circle' : 'mdi-circle-outline' }}
								</v-icon>
							</IconButton>
						</span>
					</template>
				</v-tooltip>
			</v-col>
			<v-col>
				<slot name="controllers"></slot>
			</v-col>
		</v-row>
		<v-divider class="my-4" v-if="props.visualizations.length > 0"></v-divider>
		<v-row :style="{display: props.visualizations.length > 0 ? 'block' : 'none'}">
			<v-col no-gutters>
				<v-text-field v-model.number="latInput" type="number" label="Latitude (-90 to 90)" placeholder="0.0" min="-90" max="90" />
				<v-text-field v-model.number="lonInput" type="number" label="Longitude (-180 to 180)" placeholder="0.0" min="-180" max="180" />
				<v-text-field v-model.number="altInput" type="number" label="Altitude" placeholder="0.0" min="-9999" max="99999" />
				<v-btn color="primary" @click="onSend" block>Send</v-btn>
			</v-col>
		</v-row>
	</v-container>
</template>

<style scoped></style>