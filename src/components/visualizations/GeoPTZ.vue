<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { SweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { onMounted, ref } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
// @ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js'

import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';

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
  status: boolean;
  pan: number;
  tilt: number;
  zoom: number;
}

const receivedPTZ = ref();

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
      dataDivElement.innerText += JSON.stringify(message.data) + '\n';
    }
  }
})


</script>

<template>
  <v-card :id="geoPtzId" class="pa-4">
    <v-card-title>{{visualization.name}}</v-card-title>
    <p id="datasource-gps"></p>
  </v-card>
</template>

<style scoped></style>