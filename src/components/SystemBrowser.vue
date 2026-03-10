<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSystemStore } from '@/stores/systemstore'
import { useNodeStore } from '@/stores/nodestore.js'
import { useOSHConnectStore } from '@/stores/oshconnectstore.js'
import { useUIStore } from '@/stores/uistore'
import { useVisualizationStore } from '@/stores/visualizationstore.js'
import { OSHControlStream, OSHDatastream, OSHNode, OSHSystem, OSHVisualization } from '@/lib/OSHConnectDataStructs.js'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import { Geometry } from '@/lib/OSHConnectDefinitions'
import DeleteNodeDialog from './menus/DeleteNodeDialog.vue'
import NodeConfigForm from './menus/NodeConfigForm.vue'

const oshConnect = useOSHConnectStore().getInstance();
const nodeStore = useNodeStore()
const systems = useSystemStore().systems
const visualizationStore = useVisualizationStore()
const uiStore = useUIStore();
const openNodeConfigForm = useUIStore().openNodeConfigForm
const nodeToDelete = ref<OSHNode | null>(null);

const treeItems = computed(() => {
	return nodeStore.nodes.map((node: OSHNode) => {
		return {
			id: node.uuid,
			title: node.name,
			type: 'node',
			raw: node,
			children: node.getFilteredSystems().map((system: OSHSystem) => {
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
			'map',
			null,
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
				'map',	
				null,
			);
			newViz.geometry = geom;

			visualizationStore.addVisualization(newViz);
		});
	});
};

const openDeleteNodeDialog = (node: OSHNode) => {
	nodeToDelete.value = node;
	uiStore.openDeleteNodeDialog();
};

</script>
<template>
	<v-card id="node-sidebar">
		<v-sheet class="pa-4">
			<v-tooltip text="Fetch Resources" location="bottom">
				<template v-slot:activator="{ props }">
					<IconButton
						v-bind="props"
						aria-label="Fetch Resources"
						@click="fetchResources"
						icon="mdi-refresh"
					></IconButton>
				</template>
			</v-tooltip>
			<v-btn @click="addAllSamplingFeaturePMs">All PMS</v-btn>

			<!-- Add Node -->
			<v-btn block prepend-icon="mdi-plus-circle" variant="flat" color="success" @click="openNodeConfig">
				Add Node
			</v-btn>

			<v-divider class="my-4"></v-divider>
			
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
							<IconButton v-bind="props" icon="mdi-window-close" variant="plain" class="close-btn" @click="openDeleteNodeDialog(item.raw)">
							</IconButton>
						</template>
					</v-tooltip>
					<!-- DS/CS properties -->
					<!-- TODO: Implement properties popup -->
					<v-tooltip v-if="item.type === 'ds' || item.type === 'cs'" text="Properties" location="bottom"
						open-delay="500">
						<template #activator="{ props }">
							<IconButton v-bind="props" icon="mdi-dots-vertical" variant="plain"></IconButton>
						</template>
					</v-tooltip>
				</template>
			</v-treeview>
		</v-sheet>

		<!-- DIALOGS -->
		<v-dialog v-model="uiStore.deleteNodeDialog" max-width="500">
			<DeleteNodeDialog
				:node="nodeToDelete"
			 />
		</v-dialog>
		<v-dialog v-model="uiStore.nodeConfigFormOpen" max-width="540">
			<NodeConfigForm />
		</v-dialog>
	</v-card>

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
