<script setup>
import MapView from '@/components/MapView.vue';
import SystemBrowser from '@/components/oshconnect/SystemBrowser.vue';
import VisualizationSidebar from '@/components/VisualizationSidebar.vue';

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
	<v-card rounded-0 flat class="d-flex flex-column fill-height">
		<v-container fluid class="pa-0 fill-height">
			<v-row no-gutters align="stretch" class="fill-height">
				<v-col cols="3" class="d-flex flex-column fill-height">
					<v-sheet rounded-0 class="fill-height overflow-y-auto">
						<SystemBrowser />
					</v-sheet>
				</v-col>
				<v-col cols="6" class="d-flex flex-column fill-height">
					<MapView class="fill-height" />
				</v-col>
				<v-col cols="3">
					<VisualizationSidebar> </VisualizationSidebar>
				</v-col>
			</v-row>
		</v-container>
	</v-card>
</template>

<style scoped>
.sb-placeholder {
	text-align: center;
	font-size: 1.5rem;
	color: var(--color-text);
	padding: 20px;
	background-color: var(--color-background-soft);
	border-radius: 10px;
	height: 100%;
}
</style>
