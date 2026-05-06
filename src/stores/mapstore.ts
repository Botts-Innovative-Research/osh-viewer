import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { MapLayer } from '@/modules/map/adapters/cesium.adapter';
import { CursorMode } from '@/modules/map/adapters/types';

export const useMapStore = defineStore(
	'map',
	() => {
		const focusedMap: Ref<'cesium' | 'leaflet'> = ref('cesium'); // Focused map corresponds to map type
		const selectedMapItem: Ref<any | null> = ref(null); // Currently selected map item from list of map visualizations
		const currentLLA: Ref<{ latitude: number; longitude: number; altitude: number } | null> =
			ref(null); // Currently selected LLA coordinates
		const mapCursorMode = ref<CursorMode>('default');

		/* CESIUM */
		const cesiumMapLayers: Ref<MapLayer[]> = ref([]);
		const cesiumSettings: Ref<{
			enable3DTerrain: boolean;
			enable3DBuildings: boolean;
		}> = ref({
			enable3DTerrain: true, // Whether to enable 3D terrain in Cesium
			enable3DBuildings: true, // Whether to show 3D buildings layer in Cesium
		});

		/* GEOPTZ */
		const selectedGeoPTZ: Ref<OSHVisualization[] | null> = ref(null); // Currently selected GeoPTZ Visualization(s) or null if none selected
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

		function toggleMapCursorMode() {
			if (isGeoPTZSelected.value || selectedWaypoints.value)
				mapCursorMode.value = 'crosshair';
			else mapCursorMode.value = 'default';
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
			toggleMapCursorMode()
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
			let parsedUrl: URL;
			try {
				parsedUrl = new URL(url);
			} catch (error) {
				throw new Error(`Invalid URL`);
				return;
			}

			const type = detectLayerType(parsedUrl, url);
			if (!type) {
				throw new Error(`Could not detect layer type from URL: ${url}`);
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

			if (service === 'WMS') return 'WMS';
			else if (service === 'WMTS') return 'WMTS';
			else if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}'))
				return 'XYZ';
			else if (url.endsWith('.json') || url.endsWith('.geojson')) return 'GEOJSON';
			else if (url.endsWith('.kml')) return 'KML';
			else if (url.endsWith('.czml')) return 'CZML';
			else if (url.endsWith('.gltf') || url.endsWith('.glb')) return 'GLTF';
			else return null; // Unknown layer type
		}
		function extractParams(parsed: URL, type: LayerType) {
			switch (type) {
				case 'WMS':
					return {
						layers:
							parsed.searchParams.get('LAYERS') ??
							parsed.searchParams.get('layers') ??
							'',
					};
				case 'WMTS':
					return {
						layer:
							parsed.searchParams.get('LAYER') ??
							parsed.searchParams.get('layer') ??
							'',
						style:
							parsed.searchParams.get('STYLE') ??
							parsed.searchParams.get('style') ??
							'default',
						tileMatrixSetID:
							parsed.searchParams.get('TILEMATRIXSET') ??
							parsed.searchParams.get('tilematrixset') ??
							'',
						format:
							parsed.searchParams.get('FORMAT') ??
							parsed.searchParams.get('format') ??
							'image/png',
					};
				default:
					return {};
			}
		}
		function removeLayer(id: string) {
			cesiumMapLayers.value = cesiumMapLayers.value.filter((layer: any) => layer.id !== id);
		}
		function set3DTerrain(value: boolean | null) {
			if (value === null) return;
			cesiumSettings.value.enable3DTerrain = value;
		}
		function set3DBuildings(value: boolean | null) {
			if (value === null) return;
			cesiumSettings.value.enable3DBuildings = value;
		}

		return {
			focusedMap,
			selectedMapItem,
			currentLLA,
			cesiumMapLayers,
			cesiumSettings,
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
			setSelectedWaypoints,
			clearSelectedMissionWaypoints,
			disableWaypointSelection,
			clearMissionWaypoints,
			setFlightPathWaypoints,
			triggerClearWaypointMarkers,
			resetClearWaypointMarkersSignal,
			fetchLayerFromUrl,
			removeLayer,
			set3DTerrain,
			set3DBuildings,
			mapCursorMode,
			toggleMapCursorMode,
		};
	},
	{ persist: { pick: ['focusedMap', 'cesiumMapLayers', 'cesiumSettings'] } }
);
