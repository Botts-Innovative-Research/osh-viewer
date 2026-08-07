<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import Chart from '@/modules/visualization/visualizations/chart/Chart.vue';
import Video from '@/modules/visualization/visualizations/video/Video.vue';
import Text from '@/modules/visualization/visualizations/text/Text.vue';
import Table from '@/modules/visualization/visualizations/table/Table.vue';
import TaskingWidget from '@/modules/visualization/visualizations/task/TaskingWidget.vue';
import MissionBuilder from '@/modules/visualization/visualizations/mission/MissionBuilder.vue';
import MiniMapView from '@/modules/visualization/visualizations/minimap/MiniMapView.vue';
import { onMounted, ref } from 'vue';

const { viz, customClass = '' } = defineProps<{
	viz: OSHVisualization;
	customClass?: string;
}>();

const isLoading = ref(true);

const dataSource = ref();
const dataLayer = ref();
const dataView = ref();
const controlstream = ref();

onMounted(() => {
	isLoading.value = true;
	if (Array.isArray(viz.visualizationComponents)) return;
	dataSource.value = viz.visualizationComponents.dataSource;
	dataLayer.value = viz.visualizationComponents.dataLayer;
	dataView.value = viz.visualizationComponents.dataView;
	controlstream.value = viz.visualizationComponents.controlstream;
	isLoading.value = false;
});
</script>

<template>
	<v-skeleton-loader
		type="card"
		v-if="isLoading"
	></v-skeleton-loader>
	<div
		:class="[customClass]"
		v-else
	>
		<slot name="before"></slot>
		<Chart
			:visualization="viz"
			:datasource="dataSource"
			:curve-layer="dataLayer"
			:chart-view="dataView"
			v-if="viz.type === 'chart'"
		></Chart>
		<Video
			:visualization="viz"
			:datasource="dataSource"
			:video-layer="dataLayer"
			:video-view="dataView"
			:controlstream="viz.controlstream ? viz.controlstream[0] : undefined"
			v-if="viz.type === 'video'"
		></Video>
		<Text
			:visualization="viz"
			:datasource="dataSource[0]"
			v-if="viz.type === 'text'"
		></Text>
    <Table
        :visualization="viz"
        :datasources="dataSource"
        v-if="viz.type === 'table'"
    ></Table>
		<TaskingWidget
			:visualization="viz"
			:controlstreams="controlstream"
			v-if="viz.type === 'task'"
		></TaskingWidget>
		<MissionBuilder
			:visualization="viz"
			:datasource="dataSource"
			:controlstreams="controlstream"
			v-if="viz.type === 'mission'"
		></MissionBuilder>
		<MiniMapView
			:visualization="viz"
			:datasource="dataSource"
			v-if="viz.type === 'minimap'"
		></MiniMapView>
		<slot name="after"></slot>
		<slot name="overlay"></slot>
	</div>
</template>

<style scoped></style>
