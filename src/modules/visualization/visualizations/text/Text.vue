<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { onMounted, PropType, ref } from 'vue';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { createDatasource, useVisualizationCleanup } from '../../../../components/menus/visualization-wizard/shared/helpers';
import { ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers'


// Generate a random ID when the component is created
const textboxId = ref('textbox-' + randomUUID());
const textboxDatasource = ref<any>(null);
// Received data to output
const receivedData = ref({});

const props = defineProps<{
  visualization: OSHVisualization,
  datasource: ISweApiDataSourceProperties
}>()


// Create SweApi datasource for Text visualization
onMounted(async () => {
  // Create SweApi instance from props.datasource if provided
  const dsInstance = createDatasource(props.datasource)

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

useVisualizationCleanup(ref(textboxDatasource));
</script>

<template>
  <v-sheet :id="textboxId">
    <v-container>
      <h3>Received data:</h3>
      <v-container>
        <ul>
          <li v-for="(value, key) in receivedData" :key="key">
            <strong>{{ key }}:</strong> {{ value }}
          </li>
        </ul>
      </v-container>
    </v-container>
  </v-sheet>
</template>