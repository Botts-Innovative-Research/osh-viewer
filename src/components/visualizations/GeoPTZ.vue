<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { SweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { onMounted, ref } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
// @ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js'

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
})

</script>

<template>
  <p></p>
</template>

<style scoped>

</style>