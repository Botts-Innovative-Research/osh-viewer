<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { useGeoOverlayStore } from '@/stores/geooverlaystore';
import { computed, ref, watch } from 'vue';
import { useMapStore } from '@/stores/mapstore';

const { overlay } = defineProps<{
	overlay: GeoOverlay;
}>();

const geoOverlayStore = useGeoOverlayStore();
const mapStore = useMapStore();

function getIcon(overlay: GeoOverlay) {
	if (overlay.type === 'Circle') return `mdi-vector-circle-variant`;
	if (overlay.type === 'LineString') return `mdi-vector-polyline`;
	if (overlay.type === 'Polygon') return `mdi-vector-polygon-variant`;
	if (overlay.type === 'Point') {
		return `mdi-${overlay.geometry.properties.iconName ?? 'map-marker'}`;
	}
}
function getIconColor(overlay: GeoOverlay) {
	// Default border color, use fill for point
	return overlay.geometry.properties.borderColor ?? overlay.geometry.properties.fillColor;
}

function toggleSelectedMapItem(item: GeoOverlay) {
	if (
		mapStore.selectedMapItem &&
		'geometry' in mapStore.selectedMapItem &&
		mapStore.selectedMapItem.uuid === item.uuid
	) {
		mapStore.setSelectedMapItem(null);
	} else {
		mapStore.setSelectedMapItem(item);
	}
}

// Area entities
const showAreaEntities = ref<boolean>(false);
</script>

<template>
	<v-list-item
		:key="overlay.uuid"
		@click="toggleSelectedMapItem(overlay)"
	>
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
		<!-- Subtitle for Geofence -->
		<template #subtitle>
			<span
				><i>{{
					overlay.isGeofence
						? `Geofence: ${overlay.geofenceMode === 'include' ? 'Inclusion' : 'Exclusion'}`
						: ''
				}}</i></span
			>
		</template>
		<!-- Actions -->
		<template #append>
			<div class="overlay-actions">
				<!-- Toggle visibility -->
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
							:icon="
								geoOverlayStore.isGeoOverlayVisible(overlay.uuid)
									? 'mdi-eye'
									: 'mdi-eye-off'
							"
							@click.stop="geoOverlayStore.toggleGeoOverlayVisibility(overlay.uuid)"
						></IconButton>
					</template>
				</v-tooltip>
				<!-- More actions -->
				<v-tooltip
					text="Find all entities within area"
					location="bottom"
				>
					<template v-slot:activator="{ props }">
						<IconButton
							v-bind="props"
							aria-label="Find area entities"
							size="x-small"
							variant="plain"
							icon="mdi-map-marker-radius-outline"
							@click.stop="showAreaEntities = !showAreaEntities"
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
	<v-expand-transition>
		<div v-show="showAreaEntities">
			<p>Test</p>
		</div>
	</v-expand-transition>
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
