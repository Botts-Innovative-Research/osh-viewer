<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import ChartJsView from 'osh-js/source/core/ui/view/chart/ChartJsView.js';
import CurveLayer from 'osh-js/source/core/ui/layer/CurveLayer.js';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { ISweApiDataSourceProperties } from '../../types/datasource';
import { ICurveLayerProperties } from '../../types/layers';
import { IChartViewProperties } from '../../types/views';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: ISweApiDataSourceProperties[];
	curveLayer: ICurveLayerProperties[];
	chartView: IChartViewProperties;
}>();

const chartId = ref(props.visualization.id);
let curveLayers = ref<CurveLayer[]>([]);
let chartView = ref<ChartJsView | null>(null);

onMounted(async () => {
	initializeChart();
});

// Array of SweApi instances for datasources
const dsInstances = ref<SweApi[]>([]);

function initializeChart() {
	const viz = props.visualization;
	if (!viz || viz.type !== 'chart') return;

	const dsArray: ISweApiDataSourceProperties[] = props.datasource;

	for (const dsProps of dsArray) {
		const dsInstance = createDatasource(dsProps);

		dsInstance.connect();
		dsInstances.value.push(dsInstance);
		console.log('[Chart.vue] Chart datasource created:', dsInstance);
	}

	const layerOpts: ICurveLayerProperties[] = props.curveLayer;

	for (const layer of layerOpts) {
		curveLayers.value.push(
			new CurveLayer({
				...layer,
				dataSourceIds: dsInstances.value.map((ds: any) => ds.id),
				getCurveId: (rec: any, timestamp: any) => layer.curveId,
				getValues: (rec: any, timestamp: any) => {
					const xProp = layer.values.x;
					const yProp = layer.values.y;
					return {
						x:
							rec[xProp.outputName]?.[xProp.property] ??
							rec[xProp.property] ??
							timestamp,
						y: rec[yProp.outputName]?.[yProp.property] ?? rec[yProp.property] ?? '',
					};
				},
			})
		);
	}

	console.log('[Chart.vue] Creating CurveLayers:', curveLayers.value);

	if (chartView.value) {
		chartView.value.destroy?.();
		chartView.value = null;
	}
	chartView.value = new ChartJsView({
		...props.chartView,
		container: chartId.value,
		layers: curveLayers.value,
	});
	console.log('[Chart.vue] Chart view created:', chartView.value);
}

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
	<v-sheet class="chart-card pa-4">
		<div :id="chartId"></div>
	</v-sheet>
</template>

<style scoped>
.chart-card {
	height: auto;
}
</style>
