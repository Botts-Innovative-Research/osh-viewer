import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
// @ts-ignore
import { MapLayer } from '@/modules/map/adapters/cesium.adapter';
import { fetchLayerFromUrl } from '@/modules/map/services/cesiumLayer.service';
import { CursorMode, MapPoint } from '@/modules/map/types';

export const useMapStore = defineStore(
	'map',
	() => {
		const selectedMapItem: Ref<any | null> = ref(null); // Currently selected map item from list of map visualizations
		const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
			ref(null); // Currently selected LLA coordinates

		/* CESIUM */
		const cesiumMapLayers: Ref<MapLayer[]> = ref([]);

		/* MISSION PLANNER */
		const selectedWaypoints: Ref<{
			controlStreamId: string;
			commandBaseUrl: string;
			auth: string;
		} | null> = ref(null); // Currently selected waypoints for mission planner, including control stream ID, command base URL, and auth token
		const missionWaypoints: Ref<MapPoint[]> = ref([]); // List of waypoints for mission planner
		const clearMissionWaypointsMarkers: Ref<boolean> = ref(false); // Flag to trigger clearing of mission waypoint markers on the map

		// Handle selection of map item
		function setSelectedMapItem(item: any | null) {
			selectedMapItem.value = item;
		}

		// Handle current LLA coordinates
		function setCurrentLLA(latitude: number, longitude: number, altitude: number) {
			currentLLA.value = { latitude, longitude, altitude };
		}
		function clearCurrentLLA() {
			currentLLA.value = null;
		}

		// Mission planner functions
		function setSelectedWaypoints(
			controlStreamId: string,
			commandBaseUrl: string,
			auth: string
		) {
			deselectAllTools();
			selectedWaypoints.value = { controlStreamId, commandBaseUrl, auth };
			toggleMapCursorMode();
		}
		function clearSelectedMissionWaypoints() {
			selectedWaypoints.value = null;
			missionWaypoints.value = [];
			toggleMapCursorMode();
		}
		function disableWaypointSelection() {
			selectedWaypoints.value = null;
			toggleMapCursorMode();
		}
		function clearMissionWaypoints() {
			missionWaypoints.value = [];
		}
		function setFlightPathWaypoints(waypoints: MapPoint[]) {
			missionWaypoints.value = waypoints;
		}
		function triggerClearWaypointMarkers() {
			clearMissionWaypointsMarkers.value = true;
		}
		function resetClearWaypointMarkersSignal() {
			clearMissionWaypointsMarkers.value = false;
		}

		// Cesium
		async function addLayer(url: string) {
			const newLayer: MapLayer = await fetchLayerFromUrl(url);
			if (newLayer) cesiumMapLayers.value.push(newLayer);
		}
		function removeLayer(id: string) {
			cesiumMapLayers.value = cesiumMapLayers.value.filter((layer: any) => layer.id !== id);
		}

		function deselectAllTools() {
			disableWaypointSelection();
			isDriveLocationSelected.value = false;
			isHomeLocationSelected.value = false;
			isGeoPTZSelected.value = false;
		}

		return {
			selectedMapItem,
			currentLLA,
			cesiumMapLayers,
			selectedWaypoints,
			missionWaypoints,
			clearMissionWaypointsMarkers,
			setSelectedMapItem,
			setCurrentLLA,
			clearCurrentLLA,
			setSelectedWaypoints,
			clearSelectedMissionWaypoints,
			disableWaypointSelection,
			clearMissionWaypoints,
			setFlightPathWaypoints,
			triggerClearWaypointMarkers,
			resetClearWaypointMarkersSignal,
			addLayer,
			removeLayer,
			deselectAllTools,
		};
	},
	{ persist: { pick: ['cesiumMapLayers'] } }
);
