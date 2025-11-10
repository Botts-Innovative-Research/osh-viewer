<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { SweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { computed, onMounted, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
// @ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js'
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useUIStore } from '@/stores/uistore';

// Generate a random ID when the component is created
const geoPtzId = ref('geoPtz-' + randomUUID())
const geoPtzDatasource = ref<any>(null)

const props = defineProps({
  visualization: {
    type: OSHVisualization,
    required: false,
    default: null
  },
  datasource: {
    type: SweApiDataSourceProperties,
    required: false,
    default: null
  }
})

// Define PTZ data interface
interface PTZData {
  pan: number;
  tilt: number;
  zoom: number;
}

// Received PTZ data to output
const receivedPTZ = ref<PTZData>({ pan: 0, tilt: 0, zoom: 0 });

// UI store for managing selected GeoPTZ
const uiStore = useUIStore();
const isSelected = ref(false);

// Generate commandBaseUrl from selected visualization's datastream
const commandBaseUrl = computed(() => {
  const protocol = props.datasource?.tls ? 'https' : 'http';
  return `${protocol}://${props.datasource?.endpointUrl}`;
});


onMounted(async () => {
  // Create SweApi instance from props.datasource if provided
  let dsInstance: any = null

  dsInstance = new SweApi('geoPtz-datasource', {
    endpointUrl: props.datasource.endpointUrl,
    resource: props.datasource.resource,
    tls: props.datasource.tls,
    protocol: props.datasource.protocol,
    startTime: props.datasource.startTime,
    endTime: props.datasource.endTime,
    mode: props.datasource.mode,
    responseFormat: props.datasource.responseFormat
  })
  geoPtzDatasource.value = dsInstance
  console.log('[GeoPtzView] GeoPTZ datasource created:', geoPtzDatasource.value)

  dsInstance.connect();

  const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);
  const dataDivElement = document.getElementById('datasource-gps');

  dataBroadcastChannel.onmessage = (message) => {
    if (message.data.type === 'data') {
      const data = message.data.values[0].data;
      receivedPTZ.value = {
        pan: data.pan,
        tilt: data.tilt,
        zoom: data.zoom
      }
    }
  }
})

// Watch for changes in selectedGeoPTZ to highlight or focus on this instance
watch(() => uiStore.selectedGeoPTZ?.controlStreamId, (newPtZId) => {
  // Check if ID matches this visualization's controlstream ID
  if (newPtZId === props.visualization.controlstream.id) {
    console.log('[GeoPtzView] This GeoPTZ instance is selected:', newPtZId);
    // Add logic to highlight or focus on this GeoPTZ instance in the UI
    isSelected.value = true;
  } else {
    console.log('[GeoPtzView] This GeoPTZ instance is NOT selected:', newPtZId);
    // Remove highlight or focus if needed
    isSelected.value = false;
  }
});

// Toggle selection of this GeoPTZ instance in UI store
function toggle() {
  if (isSelected.value) {
    uiStore.clearSelectedGeoPTZ();
  } else {
    uiStore.setSelectedGeoPTZ(props.visualization.controlstream.id, commandBaseUrl.value);
  }
}


</script>

<template>
  <v-card :id="geoPtzId" class="pa-4">
    <v-card-title>{{ visualization.name }}</v-card-title>
    <v-container>
      <v-row align="center">
        <v-col align="center">
          <v-btn icon :color="isSelected ? 'primary' : 'grey'" @click="toggle">
            <v-icon>{{ isSelected ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
          </v-btn>
        </v-col>
        <v-col>
          <div>
            <p>Current PTZ Values:</p>
            <p>Pan: {{ receivedPTZ.pan.toFixed(2) }}</p>
            <p>Tilt: {{ receivedPTZ.tilt.toFixed(2) }}</p>
            <p>Zoom: {{ receivedPTZ.zoom.toFixed(2) }}</p>
          </div>
        </v-col>
      </v-row>
    </v-container>

  </v-card>
</template>

<style scoped></style>