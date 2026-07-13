<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { useGeoOverlayStore } from '@/stores/geooverlaystore';

const { overlay } = defineProps<{
	overlay: GeoOverlay;
}>();

const geoOverlayStore = useGeoOverlayStore();

// function isSelected(overlay: GeoOverlay) {
// 	if (!mapStore.selectedMapItem) return false;
// 	return mapStore.selectedMapItem?.id === overlay.uuid;
// }

function getIcon(overlay: GeoOverlay) {
	if (overlay.type === 'Circle') return `mdi-vector-circle-variant`;
	if (overlay.type === 'LineString') return `mdi-vector-polyline`;
	if (overlay.type === 'Polygon') return `mdi-vector-polygon-variant`;
}
function getIconColor(overlay: GeoOverlay) {
	return overlay.geometry.properties.fillColor ?? overlay.geometry.properties.borderColor;
}

// watch(
// 	() => mapStore.selectedMapItem,
// 	(newVal) => {
// 		// If selected item is this visualization or one of its children, keep children open. Otherwise, close children.
// 		if (!newVal) {
// 			childrenOpen.value = false;
// 			return;
// 		}
// 		if (newVal.id === viz.id || viz.children.some((child) => child.id === newVal.id)) {
// 			childrenOpen.value = true;
// 		} else {
// 			childrenOpen.value = false;
// 		}
// 	}
// );
</script>

<template>
	<v-list
		activatable
		density="compact"
		select-strategy="leaf"
		class="pa-0"
	>
		<v-list-item :key="overlay.uuid">
			<!-- Icon -->
			<template #prepend>
				<v-icon
					:icon="getIcon(overlay)"
					:color="getIconColor(overlay)"
					size="24"
				></v-icon>
			</template>
			<!-- Title -->
			<template #title
				><span>{{ overlay.name }}</span></template
			>
			<!-- Actions -->
			<template #append>
				<div class="overlay-actions">
					<v-tooltip
						text="Toggle Visibility"
						location="bottom"
					>
						<template v-slot:activator="{ props }">
							<IconButton
								v-bind="props"
								aria-label="Toggle Visibility"
								size="x-small"
								variant="plain"
							></IconButton>
						</template>
					</v-tooltip>
					<DeleteButton
						label="Remove"
						@delete="geoOverlayStore.removeGeoOverlay(overlay)"
					></DeleteButton>
				</div>
			</template>
		</v-list-item>
	</v-list>
</template>

<style scoped>
.overlay-actions {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	overflow: hidden;
	max-width: 0;
	opacity: 0;
	transition:
		max-width 0.2s ease,
		opacity 0.15s ease;
}

.v-list-item:hover .overlay-actions {
	max-width: 120px;
	opacity: 1;
}
:deep(.v-list-item__spacer) {
	width: 16px;
}
</style>
