<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { onMounted, ref } from 'vue';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';


// Generate a random ID when the component is created
const textboxId = ref('textbox-' + randomUUID());
const textboxDatasource = ref<any>(null);
// Received data to output
const receivedData = ref({});

const props = defineProps({
  visualization: {
    type: OSHVisualization,
    required: false,
    default: null,
  },
  datasource: {
    type: Object,
    required: true,
    default: null,
  }
});


// Create SweApi datasource for Text visualization
onMounted(async () => {
  // Create SweApi instance from props.datasource if provided
  let dsInstance: any = null;

  dsInstance = new SweApi('geoPtz-datasource', {
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
  textboxDatasource.value = dsInstance;
  console.log('[TextView] Text datasource created:', textboxDatasource.value);

  dsInstance.connect();

  const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

  dataBroadcastChannel.onmessage = (message) => {
    if (message.data.type !== 'data') return

    const data = message.data.values[0].data
    const selectedProps: Record<string, string> = props.datasource.properties.stream.property

    const result: Record<string, any> = {}
    for (const prop of Object.values(selectedProps)) {
      if (prop && prop in data) {
        result[prop] = data[prop]
      }
    }

    receivedData.value = result
  }

});

</script>

<template>
  <v-card :id="textboxId" class="pa-4">
    <v-card-title>{{ visualization.name }}</v-card-title>
    <v-container>
      <h3>Received data:</h3>
      <ul>
        <li v-for="(value, key) in receivedData" :key="key">
          <strong>{{ key }}:</strong> {{ value }}
        </li>
      </ul>
    </v-container>
  </v-card>
</template>