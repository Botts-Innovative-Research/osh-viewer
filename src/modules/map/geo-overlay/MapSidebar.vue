<script setup lang="ts">
import { ref, watch } from 'vue';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import LineStringGeoOverlayConfig from '@/modules/map/geo-overlay/components/LineStringGeoOverlayConfig.vue';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import PolygonGeoOverlayConfig from '@/modules/map/geo-overlay/components/PolygonGeoOverlayConfig.vue';

const previewStore = useGeoOverlayPreviewStore();

const selectedTool = ref<GeoOverlayType | null>(null);

watch(selectedTool, (newVal) => {
	if (!newVal) {
		previewStore.reset();
		return;
	}
});
</script>
<template>
	<v-sheet
		id="map-sidebar"
		class="pa-2"
	>
		<!-- TOOL SELECTION BUTTONS -->
		<v-sheet class="d-flex justify-center">
			<v-btn-toggle
				v-model="selectedTool"
				class="ga-2"
			>
				<v-btn
					prepend-icon="mdi-map-marker-outline"
					variant="tonal"
					color="primary"
					value="Point"
				>
					<v-tooltip
						text="Draw point overlay on map"
						location="bottom"
						activator="parent"
					>
					</v-tooltip>
					Point
				</v-btn>
				<v-btn
					prepend-icon="mdi-vector-circle-variant"
					variant="tonal"
					color="primary"
					value="Circle"
				>
					<v-tooltip
						text="Draw circle overlay on map"
						location="bottom"
						activator="parent"
					>
					</v-tooltip>
					Circle
				</v-btn>
				<v-btn
					prepend-icon="mdi-vector-polyline"
					variant="tonal"
					color="primary"
					value="LineString"
				>
					<v-tooltip
						text="Draw polyline overlay on map"
						location="bottom"
						activator="parent"
					>
					</v-tooltip>
					Polyline
				</v-btn>
				<v-btn
					prepend-icon="mdi-vector-polygon-variant"
					variant="tonal"
					color="primary"
					value="Polygon"
				>
					<v-tooltip
						text="Draw polygon overlay on map"
						location="bottom"
						activator="parent"
					>
					</v-tooltip>
					Polygon
				</v-btn>
			</v-btn-toggle>
		</v-sheet>
		<div class="pt-2 pb-4">
			<v-divider></v-divider>
		</div>
		<!-- TOOL CONFIGS -->
		<v-expand-transition>
			<!-- LineString -->
			<LineStringGeoOverlayConfig
				v-if="selectedTool === 'LineString'"
				@close="selectedTool = null"
			/>
			<!-- Polygon -->
			<PolygonGeoOverlayConfig
				v-if="selectedTool === 'Polygon'"
				@close="selectedTool = null"
			/>
		</v-expand-transition>
	</v-sheet>
</template>
<style scoped>
#map-sidebar {
	width: 100%;
	height: 100%;
}
</style>
