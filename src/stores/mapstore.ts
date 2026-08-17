import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
// @ts-ignore
import { MapLayer } from '@/modules/map/adapters/cesium.adapter';
import { fetchLayerFromUrl } from '@/modules/map/services/cesiumLayer.service';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { GeoOverlay } from '@/modules/map/geo-overlay/types';
import { MapPoint, OfflineMapLayer } from '@/modules/map/types';

export const useMapStore = defineStore(
	'map',
	() => {
		const selectedMapItem: Ref<OSHVisualization | GeoOverlay | null> = ref(null); // Currently selected map item from list of map visualizations
		const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
			ref(null); // Currently selected LLA coordinates
		const tempLLA: Ref<MapPoint | null> = ref(null); // Right-clicked LLA coordinates

		/* OFFLINE MAP LAYERS */
		const offlineMapLayers: Ref<OfflineMapLayer[]> = ref([]);

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

		// Handle temp LLA coordinates (for right-click)
		function setTempLLA(point: MapPoint) {
			tempLLA.value = point;
		}
		function clearTempLLA() {
			tempLLA.value = null;
		}

		// Offline Map Layers
		function addOfflineMapLayer(newLayer: OfflineMapLayer) {
			offlineMapLayers.value.push(newLayer);
		}
		function removeOfflineMapLayer(id: string) {
			offlineMapLayers.value = offlineMapLayers.value.filter(
				(layer: OfflineMapLayer) => layer.id !== id
			);
		}

		// Cesium Map Layers
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
			tempLLA,
			offlineMapLayers,
			cesiumMapLayers,
			setSelectedMapItem,
			setCurrentLLA,
			clearCurrentLLA,
			setTempLLA,
			clearTempLLA,
			addOfflineMapLayer,
			removeOfflineMapLayer,
			addLayer,
			removeLayer,
		};
	},
	{ persist: { pick: ['cesiumMapLayers', 'offlineMapLayers'] } }
);
