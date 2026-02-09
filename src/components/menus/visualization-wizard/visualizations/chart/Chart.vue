<script setup lang="ts">
import {defineProps, onBeforeUnmount, onMounted, ref, toRaw, watch} from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import ChartJsView from 'osh-js/source/core/ui/view/chart/ChartJsView.js';
import CurveLayer from 'osh-js/source/core/ui/layer/CurveLayer.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { storeToRefs } from 'pinia';
import { createDatasource, useVisualizationCleanup } from '../../shared/helpers';


const props = defineProps<{
  visualization: OSHVisualization,
}>();

const chartId = ref('chart-' + randomUUID());
let curveLayer = ref<CurveLayer | null>(null);
let chartView =  ref<ChartJsView | null>(null);

onMounted(async () => {
  initializeChart();
});

// Array of SweApi instances for datasources
const dsInstances: SweApi[] = [];

function initializeChart() {
  const viz = props.visualization;
  if (!viz || viz.type !== 'chart') return;

  let getValues: any;
  const dsArray = Array.isArray(viz.visualizationComponents.dataSource)
      ? viz.visualizationComponents.dataSource
      : [viz.visualizationComponents.dataSource];

  for (const dsProps of dsArray) {
    let rawDs = toRaw(dsProps);

    const dsInstance = createDatasource(dsProps)

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

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
  <v-card class="chart-card pa-4">
    <div :id="chartId"></div>
  </v-card>
</template>

<style scoped>
.chart-card {
  height: 20vh;
}
</style>
