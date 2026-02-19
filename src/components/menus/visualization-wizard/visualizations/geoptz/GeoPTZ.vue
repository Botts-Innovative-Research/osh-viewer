<script setup lang="ts">
import { OSHControlStream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiControlStreamProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
// @ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useUIStore } from '@/stores/uistore';
import { sendCommand } from '@/lib/ControlstreamUtils';
import { createDatasource, useDisconnectDatasources } from '../../shared/helpers';

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
const isSelected = ref(false);

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

// Toggle selection of GeoPTZ in UI store and locally
function toggle() {
	if (isSelected.value) {
		uiStore.clearSelectedGeoPTZ();
	} else {
		uiStore.setSelectedGeoPTZ(props.visualizations);
	}
	isSelected.value = !isSelected.value;
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
	if (isSelected) uiStore.clearSelectedGeoPTZ();
})
</script>

<template>
	<v-card :id="randomUUID()" class="pa-4">
		<v-container>
			<v-row align="center">
				<v-col align="center">
					<v-btn icon :color="isSelected ? 'primary' : 'grey'" @click="toggle">
						<v-icon>{{
							isSelected ? 'mdi-check-circle' : 'mdi-circle-outline'
						}}</v-icon>
					</v-btn>
				</v-col>
				<v-col class="lla-inputs">
					<v-text-field v-model.number="latInput" type="number" label="Latitude" placeholder="0.0" />
					<v-text-field v-model.number="lonInput" type="number" label="Longitude" placeholder="0.0" />
					<v-text-field v-model.number="altInput" type="number" label="Altitude" placeholder="0.0" />
					<v-btn color="primary" @click="onSend">Send</v-btn>
				</v-col>
			</v-row>
		</v-container>
	</v-card>
</template>

<style scoped></style>