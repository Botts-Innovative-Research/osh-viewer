import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
	// Sidebar state (example: left and right sidebars)
	const leftSidebarOpen = ref(true);
	const rightSidebarOpen = ref(false);
	const nodeConfigFormOpen = ref(false);
	const deleteNodeDialog = ref(false);
	const propertiesDialog = ref(false);
	const vizWizOpen = ref(false);
	const editVizOpen = ref(false); // Edit visualization wizard

	// Active window items (array of IDs or names)
	const activeWindows = ref<string[]>([]);

	// Main window ID to determine center visualization
	const mainWindowId = ref<string | null>(null);

	// Example actions
	function toggleLeftSidebar() {
		leftSidebarOpen.value = !leftSidebarOpen.value;
	}
	function toggleRightSidebar() {
		rightSidebarOpen.value = !rightSidebarOpen.value;
	}
	
	function setActiveWindows(windows: string[]) {
		activeWindows.value = windows;
	}
	function setMainWindowId(id: string | null) {
		mainWindowId.value = id;
	}
	function toggleNodeConfigForm() {
		nodeConfigFormOpen.value = !nodeConfigFormOpen.value;
	}
	function openNodeConfigForm() {
		nodeConfigFormOpen.value = true;
	}
	function toggleDeleteNodeDialog() {
		deleteNodeDialog.value = !deleteNodeDialog.value;
	}
	function openDeleteNodeDialog() {
		deleteNodeDialog.value = true;
	}
	function togglePropertiesDialog() {
		propertiesDialog.value = !propertiesDialog.value;
	}
	function openPropertiesDialog() {
		propertiesDialog.value = true;
	}

	function toggleVizWiz() {
		vizWizOpen.value = !vizWizOpen.value;
	}
	function openVizWiz() {
		vizWizOpen.value = true;
	}

	function toggleEditViz() {
		editVizOpen.value = !editVizOpen.value;
	}
	function openEditViz() {
		editVizOpen.value = true;
	}
	return {
		leftSidebarOpen,
		rightSidebarOpen,
		activeWindows,
		mainWindowId,
		toggleLeftSidebar,
		toggleRightSidebar,
		setActiveWindows,
		setMainWindowId,
		nodeConfigFormOpen,
		toggleNodeConfigForm,
		deleteNodeDialog,
		toggleDeleteNodeDialog,
		openDeleteNodeDialog,
		propertiesDialog,
		togglePropertiesDialog,
		openPropertiesDialog,
		openNodeConfigForm,
		vizWizOpen,
		toggleVizWiz,
		openVizWiz,
		editVizOpen,
		toggleEditViz,
		openEditViz,
	};
}, { persist: {pick: ['theme']}});
