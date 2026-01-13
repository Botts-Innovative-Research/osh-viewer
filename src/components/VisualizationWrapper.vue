<script setup lang="ts">
import { computed, defineAsyncComponent, defineProps } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import Chart from './menus/visualization-wizard/visualizations/chart/Chart.vue';
import Video from './menus/visualization-wizard/visualizations/video/Video.vue';
import GeoPTZ from './menus/visualization-wizard/visualizations/geoptz/GeoPTZ.vue';
import Text from './menus/visualization-wizard/visualizations/text/Text.vue';

const props = defineProps({
	viz: { type: OSHVisualization, required: true },
	customClass: { type: String, default: '' },
});

</script>

<template>
	<div :class="['visualization-wrapper', customClass]">
		<slot name="before" />
		<Chart
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:curve-layer="viz.visualizationComponents.dataLayer"
			:chart-view="viz.visualizationComponents.dataView"
			v-if="viz.type === 'chart'"
		></Chart>
		<Video
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:video-layer="viz.visualizationComponents.dataLayer"
			:video-view="viz.visualizationComponents.dataView"
			v-if="viz.type === 'video'"
		></Video>
		<GeoPTZ
			:visualization="viz"
			:datasource="Array.isArray(viz.visualizationComponents.dataSource) ? viz.visualizationComponents.dataSource[0] : viz.visualizationComponents.dataSource"
			:controlstream="viz.visualizationComponents.controlstream"
			v-if="viz.type === 'geoPtz'"
		></GeoPTZ>
		<Text
			:visualization="viz"
			:datasource="Array.isArray(viz.visualizationComponents.dataSource) ? viz.visualizationComponents.dataSource[0] : viz.visualizationComponents.dataSource"
			v-if="viz.type === 'text'"
		></Text>
		<slot name="after" />
		<slot name="overlay" />
	</div>
</template>

<style scoped>
.visualization-wrapper {
	position: relative;
	padding: 0.5rem;
	border-radius: 8px;
}

.visualization-content {
	width: 100%;
	height: 100%;
}
</style>
