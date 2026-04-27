import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { GeoPTZCommand } from '@/components/menus/visualization-wizard/visualizations/geoptz/GeoPTZ.vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiControlStreamProperties } from '@/lib/VisualizationHelpers';
import { sendCommand } from '@/lib/ControlstreamUtils';

export const useMapStore = defineStore('map', () => {
	const focusedMap: Ref<'cesium' | 'leaflet'> = ref('cesium'); // Focused map corresponds to map type
	const selectedMapItem: Ref<any | null> = ref(null); // Currently selected map item from list of map visualizations
	const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
		ref(null); // Currently selected LLA coordinates

	/* CESIUM */
	const cesiumIonAssetUrl: Ref<string | null> = ref(null); // Cesium Ion asset URL to fetch

	/* GEOPTZ */
	const selectedGeoPTZ: Ref<any[] | null> = ref(null); // Currently selected GeoPTZ Visualization(s) or null if none selected
	const isGeoPTZSelected: Ref<boolean> = ref(false); // Whether a GeoPTZ visualization is currently selected

	/* MISSION PLANNER */
	const selectedWaypoints: Ref<{
		controlStreamId: string;
		commandBaseUrl: string;
		auth: string;
	} | null> = ref(null); // Currently selected waypoints for mission planner, including control stream ID, command base URL, and auth token
	const missionWaypoints: Ref<{ lat: number; lon: number; alt: number }[]> = ref([]); // List of waypoints for mission planner
	const clearMissionWaypointsMarkers: Ref<boolean> = ref(false); // Flag to trigger clearing of mission waypoint markers on the map

	// Handle selection of map type
	function setFocusedMap(value: 'cesium' | 'leaflet') {
		focusedMap.value = value;
	}
	// Handle selection of map item
	function setSelectedMapItem(item: any | null) {
		selectedMapItem.value = item;
	}

	// Handle list of selected GeoPTZ controllers
	function setSelectedGeoPTZ(vizList: OSHVisualization[]) {
		selectedGeoPTZ.value = vizList;
		if (vizList?.length === 0) setIsGeoPTZSelected(false); // If list is empty, disselect geoptz
	}
	function clearSelectedGeoPTZ() {
		selectedGeoPTZ.value = null;
		setIsGeoPTZSelected(false);
	}

	// Handle selection of GeoPTZ
	function setIsGeoPTZSelected(val: boolean) {
		isGeoPTZSelected.value = val;
	}

	// Handle current LLA coordinates
	function setCurrentLLA(latitude: number, longitude: number, altitude: number) {
		currentLLA.value = { latitude, longitude, altitude };
	}
	function clearCurrentLLA() {
		currentLLA.value = null;
	}

	// GeoPTZ Command Tasking
	function sendGeoPTZCommand(command: GeoPTZCommand) {
		// Iterate thru GeoPTZ instances
		if (selectedGeoPTZ) {
			selectedGeoPTZ.value?.map((viz: OSHVisualization) => {
				const controlstream: ISweApiControlStreamProperties | null = viz
					.visualizationComponents.controlstream
					? viz.visualizationComponents.controlstream[0]
					: null;
				if (controlstream) {
					const csId = controlstream.id;
					const commandBaseUrl = `${controlstream.tls ? 'https' : 'http'}://${controlstream.endpointUrl}`;
					const auth = {
						username: controlstream.connectorOpts.username,
						password: controlstream.connectorOpts.password,
					};
					sendCommand(commandBaseUrl, csId, command, `${auth.username}:${auth.password}`);
				} else {
					console.error('Could not send command. No controlstream found.');
				}
			});
		}
	}

	// Mission planner functions
	function setSelectedWaypoints(controlStreamId: string, commandBaseUrl: string, auth: string) {
		selectedWaypoints.value = { controlStreamId, commandBaseUrl, auth };
	}
	function clearSelectedMissionWaypoints() {
		selectedWaypoints.value = null;
		missionWaypoints.value = [];
	}

	function disableWaypointSelection() {
		selectedWaypoints.value = null;
	}

	function clearMissionWaypoints() {
		missionWaypoints.value = [];
	}
	function setFlightPathWaypoints(waypoints: { lat: number; lon: number; alt: number }[]) {
		missionWaypoints.value = waypoints;
	}

	function triggerClearWaypointMarkers() {
		clearMissionWaypointsMarkers.value = true;
	}
	function resetClearWaypointMarkersSignal() {
		clearMissionWaypointsMarkers.value = false;
	}

	return {
		focusedMap,
		selectedMapItem,
		currentLLA,
		cesiumIonAssetUrl,
		selectedGeoPTZ,
		isGeoPTZSelected,
		selectedWaypoints,
		missionWaypoints,
		clearMissionWaypointsMarkers,
    setFocusedMap,
    setSelectedMapItem,
    setCurrentLLA,
    clearCurrentLLA,
    setSelectedGeoPTZ,
    clearSelectedGeoPTZ,
    setIsGeoPTZSelected,
    sendGeoPTZCommand,
    setSelectedWaypoints,
    clearSelectedMissionWaypoints,
    disableWaypointSelection,
    clearMissionWaypoints,
    setFlightPathWaypoints,
    triggerClearWaypointMarkers,
    resetClearWaypointMarkersSignal,
	};
}, { persist: { pick: ['focusedMap'] } });
