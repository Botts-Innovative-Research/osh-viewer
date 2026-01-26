<script setup lang="ts">
import { computed } from 'vue'
import { useSystemStore } from '@/stores/systemstore.ts'
import { useNodeStore } from '@/stores/nodestore.js'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'
import { useUIStore } from '@/stores/uistore.ts'
import { useVisualizationStore } from '@/stores/visualizationstore.js'
import { OSHControlStream, OSHDatastream, OSHNode, OSHSystem, OSHVisualization } from '@/lib/OSHConnectDataStructs.js'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import NodeConfigForm from '@/components/menus/NodeConfigForm.vue'
import { storeToRefs } from 'pinia'
import { Geometry } from '@/lib/OSHConnectDefinitions'
import VisualizationWizard from '../menus/visualization-wizard/VisualizationWizard.vue'

const oshConnect = useOSHConnectStore().getInstance();
const nodeStore = useNodeStore()
const systems = useSystemStore().systems
const visualizationStore = useVisualizationStore()
const uiStore = storeToRefs(useUIStore())
const nodeConfigFormOpen = uiStore.nodeConfigFormOpen
const openNodeConfigForm = useUIStore().openNodeConfigForm
const vizWizOpen = uiStore.vizWizOpen

const treeItems = computed(() => {
	return nodeStore.nodes.map((node: OSHNode) => {
		return {
			id: node.uuid,
			title: node.name,
			type: 'node',
			raw: node,
			children: node.systems.map((system: OSHSystem) => {
				return {
					id: system.id,
					title: system.name,
					type: 'system',
					raw: system,
					children: [
						...system.datastreams.map((ds: OSHDatastream) => {
							return {
								id: ds.id,
								title: ds.name,
								type: 'ds',
								raw: ds,
							};
						}),
						...system.controlstreams.map((cs: OSHControlStream) => {
							return {
								id: cs.id,
								title: cs.name,
								type: 'cs',
								raw: cs,
							};
						}),
					],
				};
			}),
		};
	});
});

const fetchResources = () => {
	console.log('Fetch Resources button clicked', oshConnect);
	oshConnect.fetchSlowResources();
};

const openNodeConfig = () => {
	console.log('Opened node config form');
	openNodeConfigForm();
};

const addFeatureMarker = (item) => {
	console.log('Add Feature Marker button clicked for item:', item);
	const oshSystem: OSHSystem = item as OSHSystem;

	for (let foi of oshSystem.samplingFeatures) {
		console.log('Feature of Interest:', foi);

		const geom = new Geometry(
			foi.properties.id,
			foi.properties.geometry.type,
			foi.properties.geometry.coordinates,
			foi.properties,
			foi.properties.bbox
		);
		console.log('SamplingFeature Geometry:', geom);

		let newViz = new OSHVisualization(
			'featuremarker-' + randomUUID(),
			foi.properties.properties.name,
			'pointmarker-feature',
			null,
			undefined
		);
		newViz.geometry = geom;

		visualizationStore.addVisualization(newViz);
	}
};

const addAllSamplingFeaturePMs = () => {
	console.log('Add All Sampling Feature PMs button clicked');
	systems.forEach((system) => {
		system.samplingFeatures.forEach((feature) => {
			console.log('[SystemBrowser] Adding feature marker for:', feature);
			const geom = new Geometry(
				feature.properties.id,
				feature.properties.geometry.type,
				feature.properties.geometry.coordinates,
				feature.properties,
				feature.properties.bbox
			);
			let newViz = new OSHVisualization(
				'featuremarker-' + randomUUID(),
				`${feature.properties.properties.name}`,
				'pointmarker-feature',
				null,
				undefined
			);
			newViz.geometry = geom;

			visualizationStore.addVisualization(newViz);
		});
	});
};

const deleteNode = (node: OSHNode) => {
	nodeStore.removeNode(node);
	console.log('Deleted node:', node);
}

</script>
<template>
	<v-card id="node-sidebar">
		<v-card-title class="title ma-2">
			<span class="title">Nodes</span>
		</v-card-title>
		<v-divider></v-divider>

		<v-sheet class="pa-4">
		    <!-- // fetch resources below -->
			<v-btn
			    @click="fetchResources"
			    icon="mdi-refresh"
			    size="small"
			></v-btn>
			<v-btn @click="addAllSamplingFeaturePMs">All PMS</v-btn>

			<!-- Add Node -->
			<v-btn block prepend-icon="mdi-plus-circle" variant="flat" color="success" @click="openNodeConfig">
				Add Node
			</v-btn>

			<!-- Tree view of nodes/systems/datastreams -->
			<v-treeview :items="treeItems" item-value="id" item-children="children" density="compact" fluid
				items-registration="props" open-all>
				<!-- Icons -->
				<template v-slot:prepend="{ item }">
					<v-icon v-if="item.type === 'node'" icon="mdi-server"></v-icon>
					<v-icon v-if="item.type === 'system'" icon="mdi-cogs"></v-icon>
					<v-icon v-if="item.type === 'ds' || item.type === 'cs'" icon="mdi-cable-data"></v-icon>
				</template>

				<!-- Actions -->
				<template v-slot:append="{ item }">
					<!-- Remove node -->
					<v-tooltip v-if="item.type === 'node'" text="Delete" location="bottom" open-delay="500">
						<template #activator="{ props }">
							<v-btn v-bind="props" icon="mdi-window-close" size="small" variant="plain" class="close-btn"
								@click="deleteNode(item.raw)"></v-btn>
						</template>
					</v-tooltip>
					<!-- DS/CS properties -->
					<!-- TODO: Implement properties popup -->
					<v-tooltip v-if="item.type === 'ds' || item.type === 'cs'" text="Properties" location="bottom"
						open-delay="500">
						<template #activator="{ props }">
							<v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="plain"></v-btn>
						</template>
					</v-tooltip>
				</template>
			</v-treeview>
		</v-sheet>
	</v-card>

	<v-dialog v-model="nodeConfigFormOpen" max-width="540">
		<NodeConfigForm />
	</v-dialog>
	<v-dialog v-model="vizWizOpen" max-width="540">
		<VisualizationWizard />
	</v-dialog>
</template>

<style scoped>
#node-sidebar {
	width: 100%;
	height: 100%;
}

.title {
	text-align: center;
	width: 100%;
	font-size: 1.5rem;
	font-weight: bold;
}

/* Color styling for delete button */
.close-btn {
	transition: color 0.2s ease-in-out;
}

.close-btn:hover {
	color: red;
}

.close-btn:active {
	color: red;
}
</style>
