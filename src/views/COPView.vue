<script setup>
import { ref } from 'vue';
import MapView from '@/modules/map/components/MapView.vue';
import SystemBrowser from '@/modules/system-browser/SystemBrowser.vue';
import VisualizationSidebar from '@/modules/visualization/sidebar/components/VisualizationSidebar.vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import MapToolStatus from '@/modules/map/components/MapToolStatus.vue';
import MapSidebar from '@/modules/map/geo-overlay/MapSidebar.vue';

const paneSize1 = ref(localStorage.paneSize1 ?? 30); // System browser AND Visualization pane
const paneSize2 = ref(localStorage.paneSize2 ?? 70); // Map view pane
const storePaneSize = ({ panes }) => {
	localStorage.paneSize1 = panes[0].size;
	localStorage.paneSize2 = panes[1].size;
};

const tab = ref('one');
</script>

<template>
	<splitpanes @resized="storePaneSize">
		<pane
			key="system-browser"
			:size="paneSize1"
		>
			<v-sheet
				rounded-0
				class="fill-height overflow-y-auto"
			>
				<v-tabs
					color="primary"
					align-tabs="center"
					v-model="tab"
					grow
					class="equal-tabs"
				>
					<v-tab value="one">Nodes</v-tab>
					<v-tab value="two">Visualizations</v-tab>
					<v-tab value="three">Map</v-tab>
				</v-tabs>

				<v-divider></v-divider>

				<v-tabs-window v-model="tab">
					<v-tabs-window-item value="one">
						<SystemBrowser />
					</v-tabs-window-item>
					<v-tabs-window-item value="two">
						<VisualizationSidebar />
					</v-tabs-window-item>
					<v-tabs-window-item value="three">
						<MapSidebar v-if="tab === 'three'" />
					</v-tabs-window-item>
				</v-tabs-window>
			</v-sheet>
		</pane>
		<pane
			key="map-view"
			:size="paneSize2"
		>
			<MapToolStatus />
			<MapView class="fill-height" />
		</pane>
	</splitpanes>
</template>

<style scoped>
:global(.splitpanes--vertical > .splitpanes__splitter) {
	min-width: 8px;
	background-color: color-mix(in srgb, rgb(var(--v-theme-background)) 92%, black 8%);
}
.equal-tabs .v-tab {
	flex: 1;
}
</style>
