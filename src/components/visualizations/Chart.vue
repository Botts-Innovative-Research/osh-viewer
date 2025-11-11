<script setup lang="ts">
	import { defineProps, onMounted, ref } from 'vue';
	// @ts-ignore
	import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
	// @ts-ignore
	import { createDefaultDataSource } from './DataComposables';
	// @ts-ignore
	import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
	// @ts-ignore
	import { Mode } from 'osh-js/source/core/datasource/Mode';
	// @ts-ignore
	import ChartJsView from 'osh-js/source/core/ui/view/chart/ChartJsView.js';
	// @ts-ignore
	import CurveLayer from 'osh-js/source/core/ui/layer/CurveLayer.js';
	import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
	import { useUIStore } from '@/stores/uistore';
	import {
		ChartViewProperties,
		CurveLayerProperties,
		SweApiDataSourceProperties,
	} from '@/lib/VisualizationHelpers';

	// Generate a random ID when the component is created
	const chartId = ref('chart-' + randomUUID());
	const chartDatasource = ref<any>(null);
	let chartLayer: any = null;
	let chartView: any = null;

	const props = defineProps({
		visualization: {
			type: OSHVisualization,
			required: false,
			default: null,
		},
		datasource: {
			type: SweApiDataSourceProperties,
			required: false,
			default: null,
		},
		curveLayer: {
			type: CurveLayerProperties,
			required: false,
			default: null,
		},
		chartView: {
			type: ChartViewProperties,
			required: false,
			default: null,
		},
	});

	function setChartDatasource() {
		if (props.visualization) {
			console.log('[ChartVue] Visualization provided:', props.visualization);
			// this should be a valid the CS API Datastream
			chartDatasource.value = props.visualization.parentDatastream;
			return;
		}
	}

	function oldSetupMethod() {
		setChartDatasource();
		const ds = chartDatasource.value;
		console.log('[ChartVue] Chart datasource:', ds);

		const dsConverted = new SweApi(ds.name, {
			endpointUrl: ds.datastream.networkProperties.endpointUrl,
			resource: `/datastreams/${ds.datastream.properties.id}/observations`,
			tls: false,
			protocol: 'ws',
			startTime: 'now',
			endTime: '2025-08-01T00:00:00Z',
			mode: Mode.REAL_TIME,
			responseFormat: 'application/swe+json',
		});

		console.log('[ChartVue] Converted datasource:', dsConverted);

		// to fetch the schema and determine the property name
		const selectedProperty = useUIStore().selectedProperty;

		chartLayer = new CurveLayer({
			maxValues: 1000,
			// dataSourceId: chartDatasource.value.properties.id,
			dataSourceId: dsConverted.id,
			getValues: (rec: any, timestamp: any) => {
				console.log(`getValues called for record:`, rec);
				return {
					x: rec.timestamp,
					y: rec[selectedProperty.name],
				};
			},
			lineColor: 'rgba(0,220,204,0.5)',
			backgroundColor: 'rgba(49,47,47,0.64)',
			fill: true,
			getCurveId: (rec: any, timestamp: any) => 2,
			name: `${selectedProperty.label} (${selectedProperty.uom.code})`,
		});

		chartView = new ChartJsView({
			container: chartId.value,
			layers: [chartLayer],
			css: 'chart-view',
			datasetOptions: {
				tension: 0.2, // for 'line'
			},
			refreshRate: 1000,
		});

		dsConverted.connect();

		if (chartDatasource.value && typeof chartDatasource.value.connect === 'function') {
			console.log(`Connecting to datasource: ${chartDatasource.value}`);
			// chartDatasource.value.streamObservations(undefined, (data: any) => {
			//   console.log('Received data:', data)
			// });

			dsConverted.connect();

			// const dataSynchronizer = new DataSynchronizer({
			//   replaySpeed: 1,
			//   dataSources: [chartDatasource.value]
			// })
			// dataSynchronizer.connect();
		}
	}

	onMounted(async () => {
		// Create SweApi instance from props.datasource if provided
		let dsInstance: any = null;

		dsInstance = new SweApi('chart-datasource', {
			endpointUrl: props.datasource.endpointUrl,
			resource: props.datasource.resource,
			tls: props.datasource.tls,
			protocol: props.datasource.protocol,
			startTime: props.datasource.startTime,
			endTime: props.datasource.endTime,
			mode: props.datasource.mode,
			responseFormat: props.datasource.responseFormat,
		});
		chartDatasource.value = dsInstance;
		console.log('[ChartVue] Chart datasource created:', chartDatasource.value);

		// Create CurveLayer instance from props.curveLayer if provided
		chartLayer = new CurveLayer({
			maxValues: props.curveLayer.maxValues,
			dataSourceId: dsInstance.id,
			getValues: props.curveLayer.getValues,
			lineColor: props.curveLayer.lineColor,
			backgroundColor: props.curveLayer.backgroundColor,
			fill: props.curveLayer.fill,
			getCurveId: props.curveLayer.getCurveId,
			name: props.curveLayer.name,
		});
		console.log('[ChartVue] Chart layer created:', chartLayer);

		// Create ChartJsView instance from props.chartView if provided
		// chartId.value = props.chartView.container

		chartView = new ChartJsView({
			container: chartId.value,
			layers: [chartLayer],
			css: props.chartView.css,
			datasetOptions: props.chartView.datasetOptions,
			refreshRate: props.chartView.refreshRate,
		});
		console.log('[ChartVue] Chart view created:', chartView);

		dsInstance.connect();
	});
</script>

<template>
	<v-card class="chart-card pa-4">
		<v-card-title>{{ visualization.name }}</v-card-title>
		<div :id="chartId" />
	</v-card>
</template>

<style scoped>
	.chart-card {
		height: 20vh;
	}
</style>
