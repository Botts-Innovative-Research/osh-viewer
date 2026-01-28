<script setup lang="ts">
import {defineProps, onMounted, ref, toRaw} from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import ChartJsView from 'osh-js/source/core/ui/view/chart/ChartJsView.js';
import CurveLayer from 'osh-js/source/core/ui/layer/CurveLayer.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';


const props = defineProps<{
  visualization: OSHVisualization,
}>();

const chartId = ref('chart-' + randomUUID());
let curveLayer = ref<CurveLayer | null>(null);
let chartView =  ref<ChartJsView | null>(null);

onMounted(async () => {
  initializeChart();
});

function initializeChart() {
  const viz = props.visualization;
  if (!viz || viz.type !== 'chart') return;

  let getValues: any;
  const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
      ? viz.visualizationComponents.dataSource
      : [viz.visualizationComponents.dataSource];

  // Array of SweApi instances for datasources
  const dsInstances: SweApi[] = [];

  for (const dsProps of dsArray) {
    let rawDs = toRaw(dsProps);

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

    if (rawDs.properties?.x && rawDs.properties?.y) {
      getValues = (rec: any, timestamp: any) => {
        const xProp = rawDs.properties.x;
        const yProp = rawDs.properties.y;
        return {
          x: rec[xProp.outputName]?.[xProp.property] ?? rec[xProp.property] ?? timestamp,
          y: rec[yProp.outputName]?.[yProp.property] ?? rec[yProp.property] ?? '',
        }
      }
    }

    dsInstance.connect();
    dsInstances.push(dsInstance);
    console.log('[Chart.vue] Chart datasource created:', dsInstance);
  }

  const layerOpts = viz.visualizationComponents.dataLayer;

  curveLayer.value = new CurveLayer({
    ...layerOpts,
    dataSourceIds: dsInstances.map(ds => ds.id),
    ...(getValues ? { getValues } : {}),
  });
  console.log('[Chart.vue] Creating CurveLayer:', curveLayer.value);

  if (chartView.value) {
    chartView.value.destroy?.();
    chartView.value = null;
  }
  chartView.value = new ChartJsView({
    css: 'chart-view',
    datasetOptions: {
      tension: 0.2,
    },
    refreshRate: 1000,
    container: chartId.value,
    layers: [curveLayer.value],
  });
  console.log('[Chart.vue] Chart view created:', chartView.value);
}
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
