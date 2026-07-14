<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMapStore } from '@/stores/mapstore';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';

const mapInteractionStore = useMapInteractionStore();

const isActive = computed(() => {
	return (
		mapInteractionStore.isGeoPTZSelected ||
		mapInteractionStore.isMissionWaypointSelected ||
		mapInteractionStore.isDriveLocationSelected ||
		mapInteractionStore.isHomeLocationSelected ||
		mapInteractionStore.isGeoOverlayPointSelected ||
		mapInteractionStore.isGeoOverlayCircleSelected ||
		mapInteractionStore.isGeoOverlayLineStringSelected ||
		mapInteractionStore.isGeoOverlayPolygonSelected
	);
});

const isHovered = ref(false);

const toolLabel = computed(() => {
	const parts: { label: string; icon: string; color: string }[] = [];
	if (mapInteractionStore.isDriveLocationSelected)
		parts.push({ label: 'Drive Location', icon: 'mdi-steering', color: 'blue' });
	if (mapInteractionStore.isHomeLocationSelected)
		parts.push({ label: 'Home Location', icon: 'mdi-home-map-marker', color: 'yellow' });
	if (mapInteractionStore.isMissionWaypointSelected)
		parts.push({ label: 'Waypoint Selector', icon: 'mdi-map-marker-path', color: 'green' });
	if (mapInteractionStore.isGeoPTZSelected)
		parts.push({ label: 'GeoPTZ', icon: 'mdi-crosshairs-gps', color: 'red' });
	if (mapInteractionStore.isGeoOverlayPointSelected)
		parts.push({ label: 'Point Overlay', icon: 'mdi-map-marker', color: 'red' });
	if (mapInteractionStore.isGeoOverlayCircleSelected)
		parts.push({ label: 'Circle Overlay', icon: 'mdi-vector-circle-variant', color: 'red' });
	if (mapInteractionStore.isGeoOverlayLineStringSelected)
		parts.push({ label: 'Polyline Overlay', icon: 'mdi-vector-polyline', color: 'red' });
	if (mapInteractionStore.isGeoOverlayPolygonSelected)
		parts.push({ label: 'Polygon Overlay', icon: 'mdi-vector-polygon-variant', color: 'red' });
	return parts;
});
</script>

<template>
	<v-fade-transition>
		<v-card
			class="ma-0 elevation-10"
			:style="{
				position: 'absolute',
				zIndex: 2000,
				marginTop: '1%',
				marginLeft: '1%',
			}"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
			v-show="isActive"
		>
			<v-card-text class="d-flex flex-column ga-2 pa-0">
				<div
					v-for="item in toolLabel"
					:key="item.label"
					class="d-flex align-center ga-2"
					v-show="isActive"
				>
					<v-icon
						:icon="item.icon"
						:color="item.color"
					/>
					<span>{{ item.label }}</span>
					<transition name="fade-slide-x">
						<span
							v-if="isHovered"
							class="ml-1 text-grey"
						>
							cursor active
						</span>
					</transition>
				</div>
			</v-card-text>
		</v-card>
	</v-fade-transition>
</template>

<style scoped>
.fade-slide-x-enter-active,
.fade-slide-x-leave-active {
	transition: all 0.2s ease;
}

.fade-slide-x-enter-from,
.fade-slide-x-leave-to {
	opacity: 0;
	transform: translateX(-8px);
}
</style>
