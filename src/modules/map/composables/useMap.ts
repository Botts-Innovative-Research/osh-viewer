import { useMapStore } from '@/stores/mapstore';
import { computed, onMounted, ref, watch } from 'vue';
// @ts-ignore
import LeafletView from 'osh-js/source/core/ui/view/map/LeafletView';
// @ts-ignore
import CesiumView from 'osh-js/source/core/ui/view/map/CesiumView';

export function useMap() {
	const mapStore = useMapStore();
	const mapView = ref<any>(null);
	const mapType = computed(() => {
		return mapStore.focusedMap;
	});

	async function initMap() {
		if (mapType.value === 'leaflet') {
			mapView.value = new LeafletView({
				container: 'mapContainer',
				layers: [],
				autoZoomOnFirstMarker: true,
			});
		} else {
			mapView.value = new CesiumView({
				container: 'mapContainer',
				autoZoomOnFirstMarker: true,
				layers: [],
			});

			// Wait for Cesium to be fully ready
			await new Promise(requestAnimationFrame);
		}
	}

	async function destroyMap() {
		if (!mapView.value) return;
		mapView.value.destroy();
		mapView.value = null;
	}

	async function switchMap() {
		await destroyMap();
		await initMap();
	}

	onMounted(() => {
		initMap();
	});

  watch(mapType, async () => {
    await switchMap();
  })

  return {
    mapView,
    initMap,
    destroyMap,
    switchMap,
  };
}
