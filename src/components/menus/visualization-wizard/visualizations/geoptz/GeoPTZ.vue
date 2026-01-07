<script setup lang="ts">

import { computed, ref, watch } from 'vue';
// @ts-ignore
import { useUIStore } from '@/stores/uistore';
import { sendCommand } from '@/lib/ControlstreamUtils';
import {useVisualizationStore} from "@/stores/visualizationstore";
import {useControlStreamStore} from "@/stores/controlstreamstore";


const visualizationStore = useVisualizationStore();
const controlstreamStore = useControlStreamStore();
// UI store for managing selected GeoPTZ
const uiStore = useUIStore();
const isSelected = ref(false);

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

const geoPtzVisualizations = computed(() => {
  return visualizationStore.visualizations.filter((viz) => viz.type === 'geoPtz')
})

const geoPtzControl = computed(() => {
  for (const viz of geoPtzVisualizations.value) {
    if (viz.controlstream && Object.keys(viz.controlstream).length > 0) {
      const csId = Object.keys(viz.controlstream)[0];
      if (!csId) continue;
      const controlStreams = controlstreamStore.getControlStreamsById([csId]);
      if (!controlStreams || controlStreams.length === 0) continue;

      const cs = controlStreams[0];
      const networkProps = cs.controlstream.networkProperties;

      const protocol = networkProps.tls ? 'https' : 'http';
      const baseUrl = `${protocol}://${networkProps.endpointUrl}`
      const auth = `${networkProps.connectorOpts.username}:${networkProps.connectorOpts.password}`

      console.log("baseUrl", baseUrl)
      console.log("auth", auth)
      console.log("csId", csId)
      return {
        hasControl: true,
        commandBaseUrl: baseUrl,
        id: csId,
        auth: auth
      }
    }
  }
  return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };
});

// Watch for changes in selectedGeoPTZ to highlight or focus on this instance
watch(
	() => uiStore.selectedGeoPTZ?.controlStreamId,
	(newPtZId) => {
		// Check if ID matches this visualization's controlstream ID
		if (newPtZId === geoPtzControl.value.id) {
			console.log('[GeoPtzView] This GeoPTZ instance is selected:', newPtZId);
			// Add logic to highlight or focus on this GeoPTZ instance in the UI
			isSelected.value = true;
		} else {
			console.log('[GeoPtzView] This GeoPTZ instance is NOT selected:', newPtZId);
			// Remove highlight or focus if needed
			isSelected.value = false;
		}
	}
);

// Toggle selection of this GeoPTZ instance in UI store
function toggle() {
	if (isSelected.value) {
		uiStore.clearSelectedGeoPTZ();
	} else {
    if (!geoPtzControl.value.hasControl) {
      console.log("[GeoPTZ] No control given")
      return;
    }
    uiStore.setSelectedGeoPTZ(geoPtzControl.value.id, geoPtzControl.value.commandBaseUrl, geoPtzControl.value.auth);
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

  if (!geoPtzControl.value.hasControl){

  }
	console.log('[GeoPtzView] Sending GeoPTZ command:', command);
	sendCommand(geoPtzControl.value.commandBaseUrl, geoPtzControl.value.id, command, geoPtzControl.value.auth);
}
</script>

<template>
	<v-card :id="geoPtzControl.id" class="pa-4">
		<v-card-title>GeoPTZ</v-card-title>
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
					<v-text-field
						v-model.number="latInput"
						type="number"
						label="Latitude"
						placeholder="0.0"
					/>
					<v-text-field
						v-model.number="lonInput"
						type="number"
						label="Longitude"
						placeholder="0.0"
					/>
					<v-text-field
						v-model.number="altInput"
						type="number"
						label="Altitude"
						placeholder="0.0"
					/>
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
