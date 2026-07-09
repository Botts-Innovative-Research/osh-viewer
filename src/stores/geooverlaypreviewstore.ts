import { defineStore } from 'pinia';
import { Ref, ref, watch } from 'vue';
import {
	GeofenceExcludeDefaults,
	GeofenceIncludeDefaults,
	GeofenceMode,
	GeoOverlayType,
} from '@/modules/map/geo-overlay/types';
import { MapPoint } from '@/modules/map/types';

export const useGeoOverlayPreviewStore = defineStore('geoOverlayPreview', () => {
	// General properties
	const id = ref<string | null>(null);
	const type = ref<GeoOverlayType | null>(null);
	const name = ref<string | null>(null);
	const isGeofence = ref<boolean>(false);
	const geofenceMode = ref<GeofenceMode | undefined>(undefined);
	const borderColor = ref<string | null>(null);
	const fillColor = ref<string | null>(null);

	// Geometry properties
	const points = ref<MapPoint[]>([]);
	const radius = ref<number | null>(null);

	// Interaction tool active status
	const isActive = ref<boolean | null>(false);

	watch(geofenceMode, (value) => {
		if (!value) return;
		if (value === 'include') {
			borderColor.value = GeofenceIncludeDefaults.borderColor;
			fillColor.value = GeofenceIncludeDefaults.fillColor;
		} else {
			borderColor.value = GeofenceExcludeDefaults.borderColor;
			fillColor.value = GeofenceExcludeDefaults.fillColor;
		}
	});

	watch(isGeofence, (value) => {
		if (value) geofenceMode.value = 'include';
		else geofenceMode.value = undefined;
	});

	function reset() {
		id.value = null;
		name.value = null;
		isGeofence.value = false;
		geofenceMode.value = undefined;
		borderColor.value = null;
		fillColor.value = null;
		points.value = [];
		radius.value = 0;
		isActive.value = false;
	}

	return {
		id,
		type,
		name,
		isGeofence,
		geofenceMode,
		borderColor,
		fillColor,
		points,
		radius,
		isActive,
		reset,
	};
});
