import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { GeoPTZCommand } from '@/components/menus/visualization-wizard/visualizations/geoptz/GeoPTZ.vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiControlStreamProperties } from '@/lib/VisualizationHelpers';
import { sendCommand } from '@/lib/ControlstreamUtils';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';

export type LayerType =
  | 'WMS'
  | 'WMTS'
  | 'XYZ'
  | 'GEOJSON'
  | 'KML'
  | 'CZML'
  | 'GLTF';

export interface MapLayer {
  id: string;
  url: string;
  type: LayerType;
  parsedParams?: Record<string, any>; // Optional parsed parameters from URL (e.g. layers for WMS, style for WMTS, etc.)
}

export const useMapStore = defineStore('map', () => {
	const focusedMap: Ref<'cesium' | 'leaflet'> = ref('cesium'); // Focused map corresponds to map type
	const selectedMapItem: Ref<any | null> = ref(null); // Currently selected map item from list of map visualizations
	const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
		ref(null); // Currently selected LLA coordinates

	/* CESIUM */
  const cesiumMapLayers: Ref<MapLayer[]> = ref([]);

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

  // Cesium
  async function fetchLayerFromUrl(url: string) {
    const parsedUrl = new URL(url);

    const type = detectLayerType(parsedUrl, url);
    if (!type) {
      console.error('Could not detect layer type from URL:', url);
      return;
      // TODO: Add toast
    }

    const parsedParams = extractParams(parsedUrl, type);
    cesiumMapLayers.value.push({
      id: randomUUID(),
      url,
      type,
      parsedParams,
    });
  }
  function detectLayerType(parsed: URL, url: string): LayerType | null {
    const service = parsed.searchParams.get('SERVICE')?.toUpperCase();

    if (service === 'WMS') return 'WMS'
    else if (service === 'WMTS') return 'WMTS'
    else if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}')) return 'XYZ'
    else if (url.endsWith('.json') || url.endsWith('.geojson')) return 'GEOJSON'
    else if (url.endsWith('.kml')) return 'KML'
    else if (url.endsWith('.czml')) return 'CZML'
    else if (url.endsWith('.gltf') || url.endsWith('.glb')) return 'GLTF'
    else return null; // Unknown layer type
  }
  function extractParams(parsed: URL, type: LayerType) {
    switch (type) {
      case 'WMS':
        return {
          layers: parsed.searchParams.get('LAYERS') ?? parsed.searchParams.get('layers') ?? '',
          }
      case 'WMTS':
        return {
          layer: parsed.searchParams.get('LAYER') ?? parsed.searchParams.get('layer') ?? '',
          style: parsed.searchParams.get('STYLE') ?? parsed.searchParams.get('style') ?? 'default',
          tileMatrixSetID: parsed.searchParams.get('TILEMATRIXSET') ?? parsed.searchParams.get('tilematrixset') ?? '',
          format: parsed.searchParams.get('FORMAT') ?? parsed.searchParams.get('format') ?? 'image/png',
        }
      default:
        return {};
    }
  }
  function removeLayer(id: string) {
    cesiumMapLayers.value = cesiumMapLayers.value.filter((layer: any) => layer.id !== id);
	}

	return {
		focusedMap,
		selectedMapItem,
		currentLLA,
		cesiumMapLayers,
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
    fetchLayerFromUrl,
    removeLayer,
	};
}, { persist: { pick: ['focusedMap'] } });
