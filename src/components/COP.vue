<script setup>
import { ref } from 'vue';
import MapView from '@/components/MapView.vue';
import SystemBrowser from '@/components/oshconnect/SystemBrowser.vue';
import VisualizationSidebar from '@/components/VisualizationSidebar.vue';
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const paneSize1 = ref(localStorage.paneSize1 ?? 30)	// System browser pane
const paneSize2 = ref(localStorage.paneSize2 ?? 30)	// Map view pane
const paneSize3 = ref(localStorage.paneSize3 ?? 40)	// Visualization sidebar pane
const storePaneSize = ({ panes }) => {
	localStorage.paneSize1 = panes[0].size
	localStorage.paneSize2 = panes[1].size
	localStorage.paneSize3 = panes[2].size
}

</script>

<template>
	<splitpanes class="default-theme" @resized="storePaneSize">
		<pane key="system-browser" :size="paneSize1">
			<v-sheet rounded-0 class="fill-height overflow-y-auto">
				<SystemBrowser />
			</v-sheet>
		</pane>
		<pane key="map-view" :size="paneSize2">
			<MapView class="fill-height" />
		</pane>
		<pane key="visualization-sidebar" :size="paneSize3">
			<VisualizationSidebar />
		</pane>
	</splitpanes>
</template>

<style scoped>
.splitpanes--horizontal>.splitpanes__splitter {
	min-height: 6px;
	background: linear-gradient(0deg, #ccc, #111);
}
</style>
