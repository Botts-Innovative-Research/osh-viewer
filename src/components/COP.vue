<script setup>
import { ref } from 'vue';
import MapView from '@/components/MapView.vue';
import SystemBrowser from '@/components/SystemBrowser.vue';
import VisualizationSidebar from '@/components/VisualizationSidebar.vue';
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const paneSize1 = ref(localStorage.paneSize1 ?? 30)	// System browser AND Visualization pane
const paneSize2 = ref(localStorage.paneSize2 ?? 70)	// Map view pane
const storePaneSize = ({ panes }) => {
	localStorage.paneSize1 = panes[0].size
	localStorage.paneSize2 = panes[1].size
}


const tab = ref('one')

/*const connect = new OSHConnect()
const node = connect.createNode('test', 'localhost', 8282, 'sensorhub/api/', 'admin', 'admin')
const nodeStore = useNodeStore()

const getSystems = () => {
	// This function will be called when the button is clicked
	console.log('Get Systems button clicked')

	nodeStore.nodes.forEach((node) => {
		console.log('Node:', node)
		node.getAllSystems()
	})
	// node.getAllSystems()
}

const getDataStreams = () => {
	console.log('Get Data Streams button clicked')
	console.log('Node:', node)
	node.getAllDataStreams()
}*/

</script>

<template>
	<splitpanes class="default-theme" @resized="storePaneSize">
		<pane key="system-browser" :size="paneSize1">
			<v-sheet rounded-0 class="fill-height overflow-y-auto">

				<v-tabs color="primary" align-tabs="center" v-model="tab">
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
		<pane key="map-view" :size="paneSize2">
			<MapView class="fill-height" />
		</pane>
	</splitpanes>
</template>

<style scoped>
.splitpanes--horizontal>.splitpanes__splitter {
	min-height: 6px;
	background: linear-gradient(0deg, #ccc, #111);
}
</style>
