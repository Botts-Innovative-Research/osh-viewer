<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { MapInteractionMode, useMapInteractionStore } from '@/stores/mapinteractionstore';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import { useGeoOverlayStore } from '@/stores/geooverlaystore';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';

const mapInteractionStore = useMapInteractionStore();

const tools = [
	{
		tool: 'geoOverlayPoint',
		label: 'Draw point overlay',
		icon: 'mdi-map-marker-outline',
	},
	{
		tool: 'geoOverlayCircle',
		label: 'Draw circle overlay',
		icon: 'mdi-vector-circle-variant',
	},
	{
		tool: 'geoOverlayLineString',
		label: 'Draw polyline overlay',
		icon: 'mdi-vector-polyline',
	},
	{
		tool: 'geoOverlayPolygon',
		label: 'Draw polygon overlay',
		icon: 'mdi-vector-polygon-variant',
	},
];

function handleTool(tool: MapInteractionMode) {
	mapInteractionStore.selectTool(tool);
}
</script>

<template>
	<div class="speed-dial-container">
		<v-speed-dial
			location="right center"
			transition="scale-transition"
		>
			<template v-slot:activator="{ props: activatorProps }">
				<v-fab
					v-bind="activatorProps"
					size="large"
					icon="mdi-pencil"
					rounded="xxl"
				>
					<v-icon>mdi-pencil</v-icon>
					<v-tooltip
						activator="parent"
						location="top"
						>Map Tools</v-tooltip
					>
				</v-fab>
			</template>
			<div v-for="(item, index) in tools">
				<v-btn
					:key="index + 1"
					:icon="item.icon"
					rounded="xl"
					@click="handleTool(item.tool as MapInteractionMode)"
				>
					<v-icon>{{ item.icon }}</v-icon>
					<v-tooltip
						activator="parent"
						location="top"
						>{{ item.label }}</v-tooltip
					>
				</v-btn>
			</div>
		</v-speed-dial>
	</div>
</template>

<style scoped>
.speed-dial-container {
	position: absolute;
	bottom: 0;
	margin-bottom: 1%;
	margin-left: 1%;
	transform: translateY(-50%);
	z-index: 2100;
}
</style>
