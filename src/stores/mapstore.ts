import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
// @ts-ignore
import { MapLayer } from '@/modules/map/adapters/cesium.adapter';
import { fetchLayerFromUrl } from '@/modules/map/services/cesiumLayer.service';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';

export const useMapStore = defineStore(
	'map',
	() => {
		const selectedMapItem: Ref<OSHVisualization | GeoOverlay | null> = ref(null); // Currently selected map item from list of map visualizations
		const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
			ref(null); // Currently selected LLA coordinates

		/* CESIUM */
		const cesiumMapLayers: Ref<MapLayer[]> = ref([]);

		// Handle selection of map item
		function setSelectedMapItem(item: OSHVisualization | GeoOverlay | null) {
			selectedMapItem.value = item;
		}

		// Handle current LLA coordinates
		function setCurrentLLA(latitude: number, longitude: number, altitude: number) {
			currentLLA.value = { latitude, longitude, altitude };
		}
		function clearCurrentLLA() {
			currentLLA.value = null;
		}

		// Cesium
		async function addLayer(url: string) {
			const newLayer: MapLayer = await fetchLayerFromUrl(url);
			if (newLayer) cesiumMapLayers.value.push(newLayer);
		}
		function removeLayer(id: string) {
			cesiumMapLayers.value = cesiumMapLayers.value.filter((layer: any) => layer.id !== id);
		}

		return {
			selectedMapItem,
			currentLLA,
			cesiumMapLayers,
			setSelectedMapItem,
			setCurrentLLA,
			clearCurrentLLA,
			addLayer,
			removeLayer,
		};
	},
	{ persist: { pick: ['cesiumMapLayers'] } }
);
