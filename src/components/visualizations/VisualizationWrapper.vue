<script setup lang="ts">
import { computed, defineAsyncComponent, defineProps } from 'vue';
import Video from '@/components/visualizations/Video.vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import GeoPTZ from './GeoPTZ.vue';
import Chart from '../menus/visualization-wizard/visualizations/chart/Chart.vue';

const props = defineProps({
	viz: { type: OSHVisualization, required: true },
	customClass: { type: String, default: '' },
});

// Map visualization types to components
const visualizationMap: Record<string, any> = {
	video: defineAsyncComponent(() => import('./Video.vue')),
	// Add more visualization types here as needed
};

const VisualizationComponent = computed(() => visualizationMap[props.vizType]);
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
			:controlstream="Array.isArray(viz.controlstream) ? viz.controlstream[0] : viz.controlstream"
			v-if="viz.type === 'geoPtz'"
		></GeoPTZ>
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
