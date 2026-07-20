<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import PolygonGeoOverlayConfig from '@/modules/map/geo-overlay/components/PolygonGeoOverlayConfig.vue';
import CircleGeoOverlayConfig from '@/modules/map/geo-overlay/components/CircleGeoOverlayConfig.vue';
import LineStringGeoOverlayConfig from '@/modules/map/geo-overlay/components/LineStringGeoOverlayConfig.vue';
import { VueDraggable } from 'vue-draggable-plus';
import GeoOverlayWrapper from '@/modules/map/geo-overlay/components/GeoOverlayWrapper.vue';
import { useGeoOverlayStore } from '@/stores/geooverlaystore';
import { MapInteractionMode, useMapInteractionStore } from '@/stores/mapinteractionstore';

const mapInteractionStore = useMapInteractionStore();
const previewStore = useGeoOverlayPreviewStore();
const geoOverlayStore = useGeoOverlayStore();

const selectedTool = ref<MapInteractionMode | null>(null);
watch(
	() => mapInteractionStore.interactionMode,
	(mode) => {
		if (mode.startsWith('geoOverlay')) {
			selectedTool.value = mode;
			// Handle circle creation step
			if (mode === 'geoOverlayCircle') previewStore.circleCreationStep = 'center';
		}
	},
	{ immediate: true }
);
watch(selectedTool, (tool) => {
	mapInteractionStore.interactionMode = tool?.startsWith('geoOverlay') ? tool : 'none';
});

onUnmounted(() => {
	previewStore.reset();
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
				:mandatory="false"
			>
				<!--				<v-btn-->
				<!--					prepend-icon="mdi-map-marker-outline"-->
				<!--					variant="tonal"-->
				<!--					color="primary"-->
				<!--					value="Point"-->
				<!--				>-->
				<!--					<v-tooltip-->
				<!--						text="Draw point overlay on map"-->
				<!--						location="bottom"-->
				<!--						activator="parent"-->
				<!--					>-->
				<!--					</v-tooltip>-->
				<!--					Point-->
				<!--				</v-btn>-->
				<v-btn
					prepend-icon="mdi-vector-circle-variant"
					variant="tonal"
					color="primary"
					value="geoOverlayCircle"
					:active="selectedTool === 'geoOverlayCircle'"
				>
					<v-tooltip
						text="Draw circle overlay"
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
					value="geoOverlayLineString"
					:active="selectedTool === 'geoOverlayLineString'"
				>
					<v-tooltip
						text="Draw polyline overlay"
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
					value="geoOverlayPolygon"
					:active="selectedTool === 'geoOverlayPolygon'"
				>
					<v-tooltip
						text="Draw polygon overlay"
						location="bottom"
						activator="parent"
					>
					</v-tooltip>
					Polygon
				</v-btn>
			</v-btn-toggle>
		</v-sheet>
		<!-- TOOL CONFIGS -->
		<v-expand-transition>
			<!-- Circle -->
			<CircleGeoOverlayConfig
				v-if="selectedTool === 'geoOverlayCircle'"
				@close="selectedTool = 'none'"
			/>
			<!-- LineString -->
			<LineStringGeoOverlayConfig
				v-if="selectedTool === 'geoOverlayLineString'"
				@close="selectedTool = 'none'"
			/>
			<!-- Polygon -->
			<PolygonGeoOverlayConfig
				v-if="selectedTool === 'geoOverlayPolygon'"
				@close="selectedTool = 'none'"
			/>
		</v-expand-transition>
		<div class="pt-4 pb-4">
			<v-divider>Overlays</v-divider>
		</div>
		<v-sheet class="geooverlay-list overflow-y-auto">
			<VueDraggable
				v-model="geoOverlayStore.geoOverlays"
				item-key="id"
				:animation="150"
				tag="div"
				style="display: contents"
			>
				<v-list
					activatable
					density="compact"
					select-strategy="leaf"
					class="pa-0"
				>
					<GeoOverlayWrapper
						v-for="overlay in geoOverlayStore.geoOverlays"
						:overlay="overlay"
					/>
				</v-list>
			</VueDraggable>
		</v-sheet>
	</v-sheet>
</template>
<style scoped>
#map-sidebar {
	width: 100%;
	height: 100%;
}
.geooverlay-list {
	display: flex;
	flex-direction: column;
	overflow-y: scroll;
}
</style>
