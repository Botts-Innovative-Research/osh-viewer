import { defineStore } from 'pinia';
import { Ref, ref, watch } from 'vue';
import {
	GeofenceExcludeDefaults,
	GeofenceIncludeDefaults,
	GeofenceMode,
	GeoOverlay,
	GeoOverlayProperties,
	GeoOverlayType,
} from '@/modules/map/geo-overlay/types';
import { MapPoint } from '@/modules/map/types';
import { Geometry } from '@/lib/OSHConnectDataStructs';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useGeoOverlayStore } from '@/stores/geooverlaystore';
import { showToast } from '@/composables/useToast';

export const useGeoOverlayPreviewStore = defineStore('geoOverlayPreview', () => {
	// General properties
	const id = ref<string | null>(null);
	const type = ref<GeoOverlayType | null>(null);
	const name = ref<string | null>(null);
	const isGeofence = ref<boolean>(false);
	const geofenceMode = ref<GeofenceMode | undefined>(undefined);
	const borderColor = ref<string>(GeofenceExcludeDefaults.borderColor);
	const fillColor = ref<string>(GeofenceExcludeDefaults.fillColor);

	// Geometry properties
	const points = ref<MapPoint[]>([]);
	const radius = ref<number | null>(null);

	// Circle tool status
	const circleCreationStep = ref<'center' | 'radius' | null>(null);

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

	// Turn into number[] or number[][] with XYZ ([lon, lat, alt])
	function deconstructPoints(values: MapPoint[]) {
		if (!values) return [];
		// For Point and Circle, only one point -> no array
		if (values.length === 1) return [values[0].lon, values[0].lat, values[0].alt];
		else {
			return values.map((value) => {
				return [value.lon, value.lat, value.alt];
			});
		}
	}

	function reset() {
		id.value = `geoOverlay-${randomUUID()}`;
		name.value = null;
		isGeofence.value = false;
		geofenceMode.value = undefined;
		borderColor.value = GeofenceExcludeDefaults.borderColor;
		fillColor.value = GeofenceExcludeDefaults.fillColor;
		points.value = [];
		radius.value = 0;
		circleCreationStep.value = null;
	}

	function submit() {
		// Build properties
		const properties: GeoOverlayProperties = {
			borderColor: borderColor.value,
			fillColor: fillColor.value,
			radius: type.value === 'Circle' && radius.value ? radius.value : undefined,
		};
		// Build Geometry object
		const geometry = new Geometry(
			id.value!,
			type.value!,
			deconstructPoints(points.value),
			properties
		);
		// Build GeoOverlay object
		const newGeoOverlay = new GeoOverlay(
			geometry,
			name.value!,
			isGeofence.value,
			geofenceMode.value
		);

		// Add to geooverlay store
		useGeoOverlayStore().addGeoOverlay(newGeoOverlay);
		showToast(
			`${type.value === 'LineString' ? 'Polyline' : type.value} "${name.value}" created`,
			'SUCCESS'
		);
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
		circleCreationStep,
		reset,
		submit,
	};
});
