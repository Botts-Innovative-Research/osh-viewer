<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { GeofenceMode, GeoOverlayType } from '@/modules/map/geo-overlay/types';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import ColorPicker from '@/components/ui/ColorPicker.vue';

const props = defineProps<{
	defaultName: string;
	type: GeoOverlayType;
}>();

const previewStore = useGeoOverlayPreviewStore();

onMounted(() => {
	// Set with default name
	previewStore.name = props.defaultName;
});
</script>
<template>
	<v-sheet>
		<!-- Name -->
		<v-text-field
			v-model="previewStore.name"
			label="Name"
			:rules="[() => !!previewStore.name || 'Overlay name is required']"
		>
		</v-text-field>
		<v-list>
			<!-- Colors -->
			<v-list-item>
				<v-list-item-title>Border Color</v-list-item-title>
				<template #append>
					<ColorPicker v-model="previewStore.borderColor" />
				</template>
			</v-list-item>
			<v-list-item v-show="props.type === 'Circle' || props.type === 'Polygon'">
				<v-list-item-title>Fill Color</v-list-item-title>
				<template #append>
					<ColorPicker v-model="previewStore.fillColor" />
				</template>
			</v-list-item>
			<!-- Geofence -->
			<v-list-item>
				<v-list-item-title>Geofence</v-list-item-title>
				<template #append>
					<v-switch
						v-model="previewStore.isGeofence"
						color="primary"
						inset="material"
						hide-details
					></v-switch>
				</template>
			</v-list-item>
			<v-list-item v-show="previewStore.isGeofence">
				<v-btn-toggle
					v-model="previewStore.geofenceMode"
					class="d-flex w-100 ga-2"
					color="primary"
					variant="tonal"
				>
					<v-btn
						value="include"
						class="flex-grow-1"
						>Inclusion</v-btn
					>
					<v-btn
						value="exclude"
						class="flex-grow-1"
						>Exclusion</v-btn
					>
				</v-btn-toggle>
			</v-list-item>
		</v-list>
	</v-sheet>
</template>
