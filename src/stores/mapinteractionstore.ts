import { defineStore } from 'pinia';
import { computed, Ref, ref } from 'vue';
import { CursorMode } from '@/modules/map/types';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';

export type MapInteractionMode =
	| 'none'
	| 'geoptz'
	| 'missionWaypoint'
	| 'driveLocation'
	| 'homeLocation'
	| 'geoOverlayPoint'
	| 'geoOverlayLineString'
	| 'geoOverlayPolygon'
	| 'geoOverlayCircle';

export const useMapInteractionStore = defineStore(
	'mapInteraction',
	() => {
		// Active map states
		const interactionMode = ref<MapInteractionMode>('none');
		const mapCursorMode = computed<CursorMode>(() =>
			interactionMode.value === 'none' ? 'default' : 'crosshair'
		);

		// Set and toggle selected tool
		function selectTool(tool: MapInteractionMode) {
			interactionMode.value = tool;
		}
		function toggleTool(tool: MapInteractionMode) {
			interactionMode.value = interactionMode.value === tool ? 'none' : tool;
		}

		// Clean up selected tool
		function deselectTool(tool: MapInteractionMode) {
			// If it was selected, deselect
			if (interactionMode.value === tool) interactionMode.value = 'none';
			// Otherwise, leave as current state
			else return;
		}
		function deselectAllTools() {
			interactionMode.value = 'none';
		}

		// Computed helpers for tools
		const isGeoPTZSelected = computed(() => interactionMode.value === 'geoptz');
		const isMissionWaypointSelected = computed(
			() => interactionMode.value === 'missionWaypoint'
		);
		const isDriveLocationSelected = computed(() => interactionMode.value === 'driveLocation');
		const isHomeLocationSelected = computed(() => interactionMode.value === 'homeLocation');
		const isGeoOverlayPointSelected = computed(
			() => interactionMode.value === 'geoOverlayPoint'
		);
		const isGeoOverlayLineStringSelected = computed(
			() => interactionMode.value === 'geoOverlayLineString'
		);
		const isGeoOverlayPolygonSelected = computed(
			() => interactionMode.value === 'geoOverlayPolygon'
		);
		const isGeoOverlayCircleSelected = computed(
			() => interactionMode.value === 'geoOverlayCircle'
		);

		/* GeoPTZ */
		const selectedGeoPTZ: Ref<OSHVisualization[] | null> = ref(null); // Currently selected GeoPTZ Visualization(s) or null if none selected
		function setSelectedGeoPTZ(vizList: OSHVisualization[]) {
			selectedGeoPTZ.value = vizList;
			if (vizList?.length === 0) deselectTool('geoptz'); // If list is empty, deselect geoptz
		}
		function clearSelectedGeoPTZ() {
			selectedGeoPTZ.value = null;
		}

		/* GeoOverlays */
		function deselectGeoOverlayTools() {
			if (interactionMode.value.includes('geoOverlay')) deselectAllTools();
		}

		return {
			interactionMode,
			mapCursorMode,
			selectTool,
			toggleTool,
			deselectTool,
			deselectAllTools,
			isGeoPTZSelected,
			isMissionWaypointSelected,
			isDriveLocationSelected,
			isHomeLocationSelected,
			isGeoOverlayPointSelected,
			isGeoOverlayLineStringSelected,
			isGeoOverlayPolygonSelected,
			isGeoOverlayCircleSelected,
			selectedGeoPTZ,
			setSelectedGeoPTZ,
			clearSelectedGeoPTZ,
			deselectGeoOverlayTools,
		};
	},
	{}
);
