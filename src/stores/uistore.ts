import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { SchemaFieldProperty } from '@/lib/DatasourceUtils';

export const useUIStore = defineStore('ui', () => {
	// Sidebar state (example: left and right sidebars)
	const leftSidebarOpen = ref(true);
	const rightSidebarOpen = ref(false);
	const nodeConfigFormOpen = ref(false);
	const vizWizOpen = ref(false); // VizWiz = new version

	// Focused map (could be an ID or name)
	const focusedMap = ref<string | null>(null);

	// Active window items (array of IDs or names)
	const activeWindows = ref<string[]>([]);

	// Main window ID to determine center visualization
	const mainWindowId = ref<string | null>(null);

	// Currently selected datastream (null or object/ID)
	const selectedDatastream = ref<any | null>(null);

	const selectedProperty = ref<SchemaFieldProperty | null>(null);

	// Currently selected map item from list of map visualizations
	const selectedMapItem = ref<any | null>(null);

	// Currently selected GeoPTZ instance (null or controlstream data)
	const selectedGeoPTZ = ref<{
		controlStreamId: string;
		commandBaseUrl: string;
		auth: string;
		vizId: string;	// ID of associated GeoPTZ visualization
		vizName: string; // Name of GeoPTZ visualization
	} | null>(null);

	// Currently selected LLA coordinates
	const currentLLA = ref<{
		latitude: number;
		longitude: number;
		altitude: number;
	} | null>(null);

    const selectedFlightPath = ref<{
        controlStreamId: string;
        commandBaseUrl: string;
        auth: string;
    } | null>(null);

    const flightPathWaypoints = ref<{ lat: number; lon: number; alt: number }[]>([]);
    const clearFlightPathMarkersSignal = ref(false);

    // Theme state
	const theme = ref<'dark' | 'light'>('dark');

	// Example actions
	function toggleLeftSidebar() {
		leftSidebarOpen.value = !leftSidebarOpen.value;
	}
	function toggleRightSidebar() {
		rightSidebarOpen.value = !rightSidebarOpen.value;
	}
	function setFocusedMap(mapId: string | null) {
		focusedMap.value = mapId;
	}
	function setActiveWindows(windows: string[]) {
		activeWindows.value = windows;
	}
	function setMainWindowId(id: string | null) {
		mainWindowId.value = id;
	}
	function setSelectedDatastream(ds: any | null) {
		selectedDatastream.value = ds;
	}
	function setSelectedProperty(prop: SchemaFieldProperty | null) {
		selectedProperty.value = prop;
	}
	function clearSelectedProperty() {
		selectedProperty.value = null;
	}
	function toggleTheme() {
		theme.value = theme.value === 'dark' ? 'light' : 'dark';
	}
	function toggleNodeConfigForm() {
		nodeConfigFormOpen.value = !nodeConfigFormOpen.value;
	}
	function openNodeConfigForm() {
		nodeConfigFormOpen.value = true;
	}
	
	// Handle selection of map item
	function setSelectedMapItem(item: any | null) {
		selectedMapItem.value = item;
	}

	// Handle selection of GeoPTZ instance
	function setSelectedGeoPTZ(controlStreamId: string, commandBaseUrl: string, auth: string, vizId: string, vizName: string) {
		selectedGeoPTZ.value = { controlStreamId, commandBaseUrl, auth, vizId, vizName };
	}
	function clearSelectedGeoPTZ() {
		selectedGeoPTZ.value = null;
	}

	// Handle current LLA coordinates
	function setCurrentLLA(latitude: number, longitude: number, altitude: number) {
		currentLLA.value = { latitude, longitude, altitude };
	}
	function clearCurrentLLA() {
		currentLLA.value = null;
	}

	function toggleVizWiz() {
		vizWizOpen.value = !vizWizOpen.value;
	}
	function openVizWiz() {
		vizWizOpen.value = true;
	}

    function setSelectedFlightPath(controlStreamId: string, commandBaseUrl: string, auth: string) {
        selectedFlightPath.value = { controlStreamId, commandBaseUrl, auth };
    }
    function clearSelectedFlightPath() {
        selectedFlightPath.value = null;
        flightPathWaypoints.value = [];
    }

    function clearFlightPathWaypoints() {
        flightPathWaypoints.value = [];
    }
    function setFlightPathWaypoints(waypoints: { lat: number; lon: number; alt: number }[]) {
        flightPathWaypoints.value = waypoints;
    }

    function triggerClearFlightPathMarkers() {
        clearFlightPathMarkersSignal.value = true;
    }
    function resetClearFlightPathMarkersSignal() {
        clearFlightPathMarkersSignal.value = false;
    }
	return {
		leftSidebarOpen,
		rightSidebarOpen,
		focusedMap,
		activeWindows,
		mainWindowId,
		selectedDatastream,
		toggleLeftSidebar,
		toggleRightSidebar,
		setFocusedMap,
		setActiveWindows,
		setMainWindowId,
		setSelectedDatastream,
		selectedProperty,
		setSelectedProperty,
		clearSelectedProperty,
		theme,
		toggleTheme,
		nodeConfigFormOpen,
		toggleNodeConfigForm,
		openNodeConfigForm,
		selectedGeoPTZ,
		setSelectedGeoPTZ,
		clearSelectedGeoPTZ,
		currentLLA,
		setCurrentLLA,
		clearCurrentLLA,

		vizWizOpen,
		toggleVizWiz,
		openVizWiz,

        selectedFlightPath,
        setSelectedFlightPath,
        clearSelectedFlightPath,
		flightPathWaypoints,
		clearFlightPathWaypoints,
		setFlightPathWaypoints,
        clearFlightPathMarkersSignal,
        triggerClearFlightPathMarkers,
        resetClearFlightPathMarkersSignal,
				selectedMapItem,
				setSelectedMapItem,
	};
});
