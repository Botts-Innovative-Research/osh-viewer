<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import Chart from '@/modules/visualization/visualizations/chart/Chart.vue';
import Video from '@/modules/visualization/visualizations/video/Video.vue';
import Text from '@/modules/visualization/visualizations/text/Text.vue';
import Audio from '@/modules/visualization/visualizations/audio/Audio.vue';
import Table from '@/modules/visualization/visualizations/table/Table.vue';
import MissionBuilder from '@/modules/visualization/visualizations/mission/MissionBuilder.vue';
import MiniMapView from '@/modules/visualization/visualizations/minimap/MiniMapView.vue';
import Sdr from '@/modules/visualization/visualizations/sdr/Sdr.vue';
import { onMounted, ref, watch } from 'vue';


const { viz, customClass = '' } = defineProps<{
	viz: OSHVisualization;
	customClass?: string;
}>();

const isLoading = ref(true);

const dataSource = ref();
const dataLayer = ref();
const dataView = ref();
const controlstream = ref();

function init() {
	if (!viz || !viz.visualizationComponents) return;
	const comps = Array.isArray(viz.visualizationComponents)
		? viz.visualizationComponents[0]
		: viz.visualizationComponents;
	if (!comps) return;
	dataSource.value = comps.dataSource;
	dataLayer.value = comps.dataLayer;
	dataView.value = comps.dataView;
	controlstream.value = comps.controlstream;
	isLoading.value = false;
}

onMounted(() => {
	init();
});

watch(
	() => viz.visualizationComponents,
	() => {
		init();
	},
	{ deep: true, immediate: true }
);

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
		<Audio
			:visualization="viz"
			:datasource="dataSource"
			:audio-layer="dataLayer"
			:audio-view="dataView"
			v-if="viz.type === 'audio'"
		></Audio>
		<Table
			:visualization="viz"
			:datasources="dataSource"
			v-if="viz.type === 'table'"
		></Table>
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
		<Sdr
			:visualization="viz"
			:datasource="dataSource"
			:sdr-view="dataView"
			:controlstream="viz.controlstream ? viz.controlstream[0] : undefined"
			v-if="viz.type === 'sdr'"
		></Sdr>
		<slot name="after"></slot>

		<slot name="overlay"></slot>
	</div>
</template>

<style scoped></style>
