<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { SweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { computed, onMounted, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
// @ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useUIStore } from '@/stores/uistore';
import { sendCommand } from '@/lib/ControlstreamUtils';

// Generate a random ID when the component is created
const geoPtzId = ref('geoPtz-' + randomUUID());
const geoPtzDatasource = ref<any>(null);

const props = defineProps({
	visualization: {
		type: OSHVisualization,
		required: false,
		default: null,
	},
	datasource: {
		type: SweApiDataSourceProperties,
		required: true,
		default: null,
	},
	controlstream: {
		type: Object,
		required: true,
		default: null,
	}
});

// Define PTZ data interface
interface PTZData {
	pan: number;
	tilt: number;
	zoom: number;
}

// Values for LLA inputs
const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(0.0);

// Received PTZ data to output
const receivedPTZ = ref<PTZData>({ pan: 0, tilt: 0, zoom: 0 });

// UI store for managing selected GeoPTZ
const uiStore = useUIStore();
const isSelected = ref(false);

// Generate commandBaseUrl from selected visualization's controlstream
const commandBaseUrl = computed(() => {
	const protocol = props.controlstream.tls ? 'https' : 'http';
	return `${protocol}://${props.controlstream.endpointUrl}`;
});

// Controlstream authentication
const csAuth = computed(() => {
	return {username: props.controlstream.connectorOpts.username, password: props.controlstream.connectorOpts.password}
});

onMounted(async () => {
	// Create SweApi instance from props.datasource if provided
	let dsInstance: any = new SweApi('geoPtz-datasource', {
		endpointUrl: props.datasource.endpointUrl,
		resource: props.datasource.resource,
		tls: props.datasource.tls,
		protocol: props.datasource.protocol,
		startTime: props.datasource.startTime,
		endTime: props.datasource.endTime,
		mode: props.datasource.mode,
		responseFormat: props.datasource.responseFormat,
		connectorOpts: {
			username: props.datasource.connectorOpts.username ?? '',
			password: props.datasource.connectorOpts.password ?? '',
		}
	});
	geoPtzDatasource.value = dsInstance;
	console.log('[GeoPtzView] GeoPTZ datasource created:', geoPtzDatasource.value);

	dsInstance.connect();

	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			receivedPTZ.value = {
				pan: data.pan,
				tilt: data.tilt,
				zoom: data.zoom,
			};
		}
	};
});

// Watch for changes in selectedGeoPTZ to highlight or focus on this instance
watch(
	() => uiStore.selectedGeoPTZ,
	(newVal) => {
		// Check if ID matches this visualization's controlstream ID
		if (newVal?.controlStreamId === props.controlstream.id) {
			console.log('[GeoPtzView] This GeoPTZ instance is selected:', newVal?.controlStreamId);
			// Add logic to highlight or focus on this GeoPTZ instance in the UI
			isSelected.value = true;
		} else {
			console.log('[GeoPtzView] This GeoPTZ instance is NOT selected:', newVal?.controlStreamId);
			// Remove highlight or focus if needed
			isSelected.value = false;
		}
	}
);

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

// Toggle selection of this GeoPTZ instance in UI store
function toggle() {
	if (isSelected.value) {
		uiStore.clearSelectedGeoPTZ();
	} else {
		uiStore.setSelectedGeoPTZ(props.controlstream.id, commandBaseUrl.value, `${csAuth.value.username}:${csAuth.value.password}`);
	}
}

// Send PTZ command based on LLA inputs
function onSend() {
	const command = {
		parameters: {
			lat: latInput.value,
			lon: lonInput.value,
			alt: altInput.value,
		},
	};

	console.log('[GeoPtzView] Sending GeoPTZ command:', command);
	sendCommand(commandBaseUrl.value, props.controlstream.id, command, `${csAuth.value.username}:${csAuth.value.password}`);
}
</script>

<template>
	<v-card :id="geoPtzId" class="pa-4">
		<v-card-title>{{ visualization.name }}</v-card-title>
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
				<v-col>
					<h3>Converted PTZ:</h3>
					<p>Pan: {{ receivedPTZ.pan.toFixed(2) }}</p>
					<p>Tilt: {{ receivedPTZ.tilt.toFixed(2) }}</p>
					<p>Zoom: {{ receivedPTZ.zoom.toFixed(2) }}</p>
				</v-col>
			</v-row>
		</v-container>
	</v-card>
</template>

<style scoped></style>