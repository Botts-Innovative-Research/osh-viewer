import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
// @ts-ignore
import { MapLayer } from '@/modules/map/adapters/cesium.adapter';
import { CursorMode, MapPoint } from '@/modules/map/adapters/types';
import { fetchLayerFromUrl } from '@/modules/map/services/cesiumLayer.service';

export const useMapStore = defineStore(
	'map',
	() => {
		const selectedMapItem: Ref<any | null> = ref(null); // Currently selected map item from list of map visualizations
		const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
			ref(null); // Currently selected LLA coordinates
		const mapCursorMode = ref<CursorMode>('default');

		/* CESIUM */
		const cesiumMapLayers: Ref<MapLayer[]> = ref([]);

		/* GEOPTZ */
		const selectedGeoPTZ: Ref<OSHVisualization[] | null> = ref(null); // Currently selected GeoPTZ Visualization(s) or null if none selected
		const isGeoPTZSelected: Ref<boolean> = ref(false); // Whether a GeoPTZ visualization is currently selected

		/* DRIVE LOCATION */
		const isDriveLocationSelected: Ref<boolean> = ref(false);

		/* HOME LOCATION */
		const isHomeLocationSelected: Ref<boolean> = ref(false);


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

		function toggleMapCursorMode() {
			if (isGeoPTZSelected.value || selectedWaypoints.value || isDriveLocationSelected.value || isHomeLocationSelected.value)
				mapCursorMode.value = 'crosshair';
			else mapCursorMode.value = 'default';
		}

		// GeoPTZ functions
		function setSelectedGeoPTZ(vizList: OSHVisualization[]) {
			selectedGeoPTZ.value = vizList;
			if (vizList?.length === 0) setIsGeoPTZSelected(false); // If list is empty, disselect geoptz
		}
		function clearSelectedGeoPTZ() {
			selectedGeoPTZ.value = null;
			setIsGeoPTZSelected(false);
		}
		function setIsGeoPTZSelected(val: boolean) {
			if (val) {
				deselectAllTools();
			}
			isGeoPTZSelected.value = val;
			toggleMapCursorMode();
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

		// Drive Location functions
		function setIsDriveLocationSelected(val: boolean) {
			if (val) {
				deselectAllTools();
			}
			isDriveLocationSelected.value = val;
			toggleMapCursorMode();
		}

		// Home Location functions
		function setIsHomeLocationSelected(val: boolean) {
			if (val) {
				deselectAllTools();
			}
			isHomeLocationSelected.value = val;
			toggleMapCursorMode();
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
			selectedGeoPTZ,
			isGeoPTZSelected,
			selectedWaypoints,
			missionWaypoints,
			clearMissionWaypointsMarkers,
			isDriveLocationSelected,
			isHomeLocationSelected,
			setSelectedMapItem,
			setCurrentLLA,
			clearCurrentLLA,
			setSelectedGeoPTZ,
			clearSelectedGeoPTZ,
			setIsGeoPTZSelected,
			setSelectedWaypoints,
			clearSelectedMissionWaypoints,
			disableWaypointSelection,
			clearMissionWaypoints,
			setFlightPathWaypoints,
			triggerClearWaypointMarkers,
			resetClearWaypointMarkersSignal,
			setIsDriveLocationSelected,
			setIsHomeLocationSelected,
			addLayer,
			removeLayer,
			mapCursorMode,
			toggleMapCursorMode,
			deselectAllTools,
		};
	},
	{ persist: { pick: ['cesiumMapLayers'] } }
);
