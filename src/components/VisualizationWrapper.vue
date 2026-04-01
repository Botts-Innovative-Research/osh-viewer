<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import Chart from './menus/visualization-wizard/visualizations/chart/Chart.vue';
import Video from './menus/visualization-wizard/visualizations/video/Video.vue';
import GeoPTZ from './menus/visualization-wizard/visualizations/geoptz/GeoPTZ.vue';
import Text from './menus/visualization-wizard/visualizations/text/Text.vue';
import MissionBuilder from '@/components/menus/visualization-wizard/visualizations/mission/MissionBuilder.vue';
import { IChartViewProperties, ICurveLayerProperties, IVideoLayerProperties, IVideoViewProperties } from '@/lib/VisualizationHelpers';

const { viz, customClass = '' } = defineProps<{
  viz: OSHVisualization,
  customClass?: string,
}>()

</script>

<template>
	<div :class="[customClass]">
		<slot name="before" />
		<Chart
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:curve-layer="(viz.visualizationComponents.dataLayer as ICurveLayerProperties)"
			:chart-view="(viz.visualizationComponents.dataView as IChartViewProperties)"
			v-if="viz.type === 'chart'"
		></Chart>
		<Video
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:video-layer="(viz.visualizationComponents.dataLayer as IVideoLayerProperties)"
			:video-view="(viz.visualizationComponents.dataView as IVideoViewProperties)"
			:controlstream="(viz.controlstream ? viz.controlstream[0] : undefined)"
			v-if="viz.type === 'video'"
		></Video>
		<Text
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource[0]"
			v-if="viz.type === 'text'"
		></Text>
    <MissionBuilder
        :visualization="viz"
        :datasource="Array.isArray(viz.visualizationComponents.dataSource) ? viz.visualizationComponents.dataSource : [viz.visualizationComponents.dataSource]"
        :controlstreams="Array.isArray(viz.visualizationComponents.controlstream) ? viz.visualizationComponents.controlstream : [viz.visualizationComponents.controlstream]"
        v-if="viz.type === 'mission'"
    ></MissionBuilder>
		<slot name="after" />
		<slot name="overlay" />
	</div>
</template>

<style scoped>
</style>
