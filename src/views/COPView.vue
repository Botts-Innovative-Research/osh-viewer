<script setup>
import { ref } from 'vue';
import MapView from '@/modules/map/components/MapView.vue';
import SystemBrowser from '@/modules/system-browser/SystemBrowser.vue';
import VisualizationSidebar from '@/modules/visualization/sidebar/components/VisualizationSidebar.vue';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

const paneSize1 = ref(localStorage.paneSize1 ?? 30); // System browser AND Visualization pane
const paneSize2 = ref(localStorage.paneSize2 ?? 70); // Map view pane
const storePaneSize = ({ panes }) => {
	localStorage.paneSize1 = panes[0].size;
	localStorage.paneSize2 = panes[1].size;
};

const tab = ref('one');
</script>

<template>
	<splitpanes
		class="default-theme"
		@resized="storePaneSize"
	>
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
				</v-tabs>

				<v-divider></v-divider>

				<v-tabs-window v-model="tab">
					<v-tabs-window-item value="one">
						<SystemBrowser />
					</v-tabs-window-item>
					<v-tabs-window-item value="two">
						<VisualizationSidebar />
					</v-tabs-window-item>
				</v-tabs-window>
			</v-sheet>
		</pane>
		<pane
			key="map-view"
			:size="paneSize2"
		>
			<MapView class="fill-height" />
		</pane>
	</splitpanes>
</template>

<style scoped>
.splitpanes--horizontal > .splitpanes__splitter {
	min-height: 6px;
	background: linear-gradient(0deg, #ccc, #111);
}
.equal-tabs .v-tab {
	flex: 1;
}
</style>
