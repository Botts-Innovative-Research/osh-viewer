<script setup lang="ts">
	import { computed, defineAsyncComponent, defineProps } from 'vue';
	import Chart from '@/components/visualizations/Chart.vue';
	import Video from '@/components/visualizations/Video.vue';
	import { OSHVisualization } from '@/lib/OSHConnectDataStructs';

	const props = defineProps({
		viz: { type: OSHVisualization, required: true },
		customClass: { type: String, default: '' },
	});

	// Map visualization types to components
	const visualizationMap: Record<string, any> = {
		chart: defineAsyncComponent(() => import('./Chart.vue')),
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
			v-if="viz.type === 'chart'"
			:datasource="viz.visualizationComponents.dataSource"
			:curve-layer="viz.visualizationComponents.dataLayer"
			:chart-view="viz.visualizationComponents.dataView"></Chart>
		<Video
			:visualization="viz"
			:datasource="viz.visualizationComponents.dataSource"
			:video-layer="viz.visualizationComponents.dataLayer"
			:video-view="viz.visualizationComponents.dataView"
			v-if="viz.type === 'video'"></Video>
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
