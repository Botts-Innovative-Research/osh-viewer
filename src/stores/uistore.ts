import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { SchemaFieldProperty } from '@/lib/DatasourceUtils';

export const useUIStore = defineStore('ui', () => {
	// Sidebar state (example: left and right sidebars)
	const leftSidebarOpen = ref(true);
	const rightSidebarOpen = ref(false);
	const visualizationWizardOpen = ref(false);
	const nodeConfigFormOpen = ref(false);

	// Focused map (could be an ID or name)
	const focusedMap = ref<string | null>(null);

	// Active window items (array of IDs or names)
	const activeWindows = ref<string[]>([]);

	// Main window ID to determine center visualization
	const mainWindowId = ref<string | null>(null);

	// Currently selected datastream (null or object/ID)
	const selectedDatastream = ref<any | null>(null);

	const selectedProperty = ref<SchemaFieldProperty | null>(null);

	// Currently selected GeoPTZ instance (null or controlstream data)
	const selectedGeoPTZ = ref<{
		controlStreamId: string;
		commandBaseUrl: string;
	} | null>(null);

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
	function toggleVisualizationWizard() {
		visualizationWizardOpen.value = !visualizationWizardOpen.value;
	}
	function openVisualizationWizard() {
		visualizationWizardOpen.value = true;
	}
	function toggleNodeConfigForm() {
		nodeConfigFormOpen.value = !nodeConfigFormOpen.value;
	}
	function openNodeConfigForm() {
		nodeConfigFormOpen.value = true;
	}

	// Handle selection of GeoPTZ instance
	function setSelectedGeoPTZ(controlStreamId: string, commandBaseUrl: string) {
		selectedGeoPTZ.value = { controlStreamId, commandBaseUrl };
	}
	function clearSelectedGeoPTZ() {
		selectedGeoPTZ.value = null;
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
		visualizationWizardOpen,
		toggleVisualizationWizard,
		openVisualizationWizard,
		nodeConfigFormOpen,
		toggleNodeConfigForm,
		openNodeConfigForm,
		selectedGeoPTZ,
		setSelectedGeoPTZ,
		clearSelectedGeoPTZ,
	};
});
