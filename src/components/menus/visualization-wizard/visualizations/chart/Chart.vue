<script setup lang="ts">
import { defineProps, onMounted, ref } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import ChartJsView from 'osh-js/source/core/ui/view/chart/ChartJsView.js';
import CurveLayer from 'osh-js/source/core/ui/layer/CurveLayer.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import {
  ChartViewProperties,
  CurveLayerProperties,
  SweApiDataSourceProperties,
} from '@/lib/VisualizationHelpers';

// Generate a random ID when the component is created
const chartId = ref('chart-' + randomUUID());
let chartLayer: any = null;
let chartView: any = null;

const props = defineProps<{
  visualization: OSHVisualization,
  datasource?: SweApiDataSourceProperties,
  curveLayer?: CurveLayerProperties,
  chartView?: ChartViewProperties,
}>()

onMounted(async () => {
  // Array of datasources
  const dsArray = Array.isArray(props.visualization.visualizationComponents.dataSource)
    ? props.visualization.visualizationComponents.dataSource
    : [props.visualization.visualizationComponents.dataSource];

  // Array of SweApi instances for datasources
  const dsInstances: SweApi[] = [];

  for (const dsProps of dsArray) {
    const dsInstance = new SweApi(dsProps.id, {
      endpointUrl: dsProps.endpointUrl,
      resource: dsProps.resource,
      tls: dsProps.tls,
      protocol: dsProps.protocol,
      startTime: dsProps.startTime,
      endTime: dsProps.endTime,
      mode: dsProps.mode,
      responseFormat: dsProps.responseFormat,
      connectorOpts: {
        username: dsProps?.connectorOpts.username,
        password: dsProps?.connectorOpts.password
      }
    });
    
    dsInstance.connect();
    dsInstances.push(dsInstance);
    console.log('[ChartVue] Chart datasource created:', dsInstance);
  }

  // Create CurveLayer instance from props.curveLayer if provided
  chartLayer = new CurveLayer({
    ...props.curveLayer,
    dataSourceIds: dsInstances.map(ds => ds.id),
  });
  console.log('[ChartVue] Chart layer created:', chartLayer);

  // Create ChartJsView instance from props.chartView if provided
  // chartId.value = props.chartView.container

  chartView = new ChartJsView({
    ...props.chartView,
    container: chartId.value,
    layers: [chartLayer],
  });
  console.log('[ChartVue] Chart view created:', chartView);
});
</script>

<template>
  <v-card class="chart-card pa-4">
    <v-card-title>{{ props.visualization.name }}</v-card-title>
    <div :id="chartId"></div>
  </v-card>
</template>

<style scoped>
.chart-card {
  height: 20vh;
}
</style>
