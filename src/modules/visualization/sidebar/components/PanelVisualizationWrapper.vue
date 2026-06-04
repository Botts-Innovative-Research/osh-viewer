<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import Chart from '@/modules/visualization/visualizations/chart/Chart.vue';
import Video from '@/modules/visualization/visualizations/video/Video.vue';
import Text from '@/modules/visualization/visualizations/text/Text.vue';
import MissionBuilder from '@/modules/visualization/visualizations/mission/MissionBuilder.vue';
import { ICurveLayerProperties, IVideoLayerProperties } from '../../types/layers';
import { IChartViewProperties, IVideoViewProperties } from '../../types/views';

const { viz, customClass = '' } = defineProps<{
	viz: OSHVisualization;
	customClass?: string;
}>();
</script>

<template>
	<div :class="[customClass]">
		<slot name="before"></slot>
		<Chart
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:curve-layer="viz.visualizationComponents.dataLayer as ICurveLayerProperties[]"
			:chart-view="viz.visualizationComponents.dataView as IChartViewProperties"
			v-if="viz.type === 'chart'"
		></Chart>
		<Video
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:video-layer="viz.visualizationComponents.dataLayer as IVideoLayerProperties"
			:video-view="viz.visualizationComponents.dataView as IVideoViewProperties"
			:controlstream="viz.controlstream ? viz.controlstream[0] : undefined"
			v-if="viz.type === 'video'"
		></Video>
		<Text
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource[0]"
			v-if="viz.type === 'text'"
		></Text>
		<MissionBuilder
			:visualization="viz"
			:datasource="
				Array.isArray(viz.visualizationComponents.dataSource)
					? viz.visualizationComponents.dataSource
					: [viz.visualizationComponents.dataSource]
			"
			:controlstreams="
				Array.isArray(viz.visualizationComponents.controlstream)
					? viz.visualizationComponents.controlstream
					: [viz.visualizationComponents.controlstream]
			"
			v-if="viz.type === 'mission'"
		></MissionBuilder>
		<slot name="after"></slot>
		<slot name="overlay"></slot>
	</div>
</template>

<style scoped></style>
