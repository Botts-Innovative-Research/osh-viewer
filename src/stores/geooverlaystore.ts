import { defineStore } from 'pinia';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { computed, ref } from 'vue';

export const useGeoOverlayStore = defineStore(
	'geoOverlays',
	() => {
		const geoOverlays = ref<GeoOverlay[]>([]);

		// Filter only POINT geo overlays
		const pointGeoOverlays = computed(() => {
			return geoOverlays.value.filter((go: GeoOverlay) => go.type === 'Point');
		});
		// Filter only CIRCLE geo overlays
		const circleGeoOverlays = computed(() => {
			return geoOverlays.value.filter((go: GeoOverlay) => go.type === 'Circle');
		});
		// Filter only LINESTRING geo overlays
		const polylineGeoOverlays = computed(() => {
			return geoOverlays.value.filter((go: GeoOverlay) => go.type === 'LineString');
		});
		// Filter only POLYGON geo overlays
		const polygonGeoOverlays = computed(() => {
			return geoOverlays.value.filter((go: GeoOverlay) => go.type === 'Polygon');
		});

		function addGeoOverlay(geoOverlay: GeoOverlay) {
			geoOverlays.value = [...geoOverlays.value, geoOverlay];
			console.log('GeoOverlay added to store:', geoOverlay);
		}

		function removeGeoOverlay(geoOverlay: GeoOverlay) {
			geoOverlays.value = geoOverlays.value.filter(
				(go: GeoOverlay) => go.uuid !== geoOverlay.uuid
			);
		}

		function removeAllGeoOverlays() {
			geoOverlays.value = [];
		}

		function getGeoOverlayById(id: string) {
			return geoOverlays.value.find((go: GeoOverlay) => go.uuid === id);
		}

		return {
			geoOverlays,
			pointGeoOverlays,
			circleGeoOverlays,
			polylineGeoOverlays,
			polygonGeoOverlays,
			addGeoOverlay,
			removeGeoOverlay,
			removeAllGeoOverlays,
			getGeoOverlayById,
		};
	},
	{ persist: { pick: ['geoOverlays'] } }
);
