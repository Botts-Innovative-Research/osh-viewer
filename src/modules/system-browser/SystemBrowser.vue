<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSystemStore } from '@/stores/systemstore';
import { useNodeStore } from '@/stores/nodestore.js';
import { useOSHConnectStore } from '@/stores/oshconnectstore.js';
import { useUIStore } from '@/stores/uistore';
import { useVisualizationStore } from '@/stores/visualizationstore.js';
import {
	OSHControlStream,
	OSHDatastream,
	OSHNode,
	OSHSystem,
} from '@/lib/OSHConnectDataStructs.js';
import { Geometry } from '@/lib/OSHConnectDataStructs';
import DeleteNodeDialog from '@/modules/system-browser/components/DeleteNodeDialog.vue';
import NodeConfigForm from '@/modules/system-browser/components/NodeConfigForm.vue';
import PropertiesDialog from '@/modules/system-browser/components/PropertiesDialog.vue';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import NodeIcon from '@/components/icons/node-logo.svg';
import FoiStyleDialog from './components/FoiStyleDialog.vue';
import { showToast } from '@/composables/useToast.js';

const oshConnect = useOSHConnectStore().getInstance();
const nodeStore = useNodeStore();
const systems = useSystemStore().systems;
const visualizationStore = useVisualizationStore();
const uiStore = useUIStore();
const nodeToDelete = ref<OSHNode | null>(null);
const propertiesRef = ref<OSHDatastream | OSHControlStream | null>(null);
const foiRef = ref<OSHSystem | null>(null);

type TreeItem = {
	id: string;
	title: string;
	type: string;
	raw: OSHNode | OSHSystem | OSHDatastream | OSHControlStream;
	children?: TreeItem[];
};
const treeItems = ref<TreeItem[]>([]);
watch(
	() => nodeStore.nodes,
	(nodes: OSHNode[]) => {
		treeItems.value = nodes.map((node: OSHNode) => ({
			id: node.uuid,
			title: node.name,
			type: 'node',
			raw: node,
			children: node.getFilteredSystems().map((system: OSHSystem) => ({
				id: system.id,
				title: system.name,
				type: 'system',
				raw: system,
				children: [
					...system.datastreams.map((ds: OSHDatastream) => ({
						id: ds.id,
						title: ds.name,
						type: 'ds',
						raw: ds,
					})),
					...system.controlstreams.map((cs: OSHControlStream) => ({
						id: cs.id,
						title: cs.name,
						type: 'cs',
						raw: cs,
					})),
				],
			})),
		}));
	},
	{ immediate: true, deep: true }
);

const fetchResources = () => {
	oshConnect.fetchSlowResources();
};

const hasFOIs = (system: OSHSystem) => {
	return !!system.samplingFeatures.length;
};

const addFOILayer = (system: OSHSystem): number => {
	let count = 0;
	system.samplingFeatures.forEach((foi: any) => {
		if (!foi.properties.geometry) return;
		const geom = new Geometry(
			foi.properties.id,
			system.id,
			foi.properties.geometry.type ?? '',
			foi.properties.geometry.coordinates,
			foi.properties,
			foi.properties.bbox
		);
		const added = visualizationStore.addFOILayer(geom);
		if (added) count++;
	});
	return count;
};

const addAllFOIs = () => {
	let count = 0;
	systems.forEach((system: OSHSystem) => {
		count += addFOILayer(system);
	});
	if (count === 0) showToast('No new FOIs added.', 'DEFAULT');
	else showToast(`Added ${count} FOI${count > 1 ? 's' : ''}`, 'SUCCESS');
};

const removeAllFOIs = () => {
	const count = visualizationStore.foiLayers.length;
	visualizationStore.clearFOILayers();
	if (count > 0) showToast(`Deleted all ${count} FOI${count > 1 ? 's' : ''}`);
};

const openNodeConfig = () => {
	uiStore.openNodeConfigForm();
};

const openDeleteNodeDialog = (node: any) => {
	nodeToDelete.value = node;
	uiStore.openDeleteNodeDialog();
};

const openPropertiesDialog = (item: any) => {
	propertiesRef.value = item;
	uiStore.openPropertiesDialog();
};

const openFoiStyleDialog = (system: any) => {
	foiRef.value = system;
	uiStore.openFoiStyleDialog();
};
</script>
<template>
	<v-sheet
		id="node-sidebar"
		class="pa-4"
	>
		<!-- Add Node -->
		<v-row class="align-center">
			<v-col cols="auto"
				><v-tooltip
					text="Fetch Resources"
					location="bottom"
				>
					<template v-slot:activator="{ props }">
						<IconButton
							v-bind="props"
							aria-label="Fetch Resources"
							@click="fetchResources"
							icon="mdi-refresh"
						></IconButton>
					</template> </v-tooltip
			></v-col>
			<v-col
				><v-btn
					block
					prepend-icon="mdi-plus-circle"
					color="success"
					@click="openNodeConfig"
				>
					Add Node
				</v-btn>
			</v-col>
		</v-row>
		<v-divider class="mt-3 mb-3"></v-divider>
		<!-- FOIs -->
		<v-row class="align-center">
			<v-col cols="6"
				><v-btn
					block
					prepend-icon="mdi-map-marker-multiple-outline"
					variant="outlined"
					color=""
					@click="addAllFOIs"
					class="text-none"
				>
					Add All FOIs
				</v-btn></v-col
			>
			<v-col cols="6"
				><v-btn
					block
					prepend-icon="mdi-close"
					variant="outlined"
					@click="removeAllFOIs"
					class="text-none"
					:disabled="!!!visualizationStore.foiLayers.length"
				>
					Delete All FOIs
				</v-btn></v-col
			>
		</v-row>
		<v-divider class="mt-3"></v-divider>
		<!-- Tree view of nodes/systems/datastreams -->
		<v-treeview
			:items="treeItems"
			item-value="id"
			item-children="children"
			fluid
			open-all
		>
			<!-- Icons -->
			<template v-slot:prepend="{ item }">
				<v-icon
					v-if="item.type === 'node'"
					:icon="NodeIcon"
				></v-icon>
				<v-icon
					v-if="item.type === 'system'"
					icon="mdi-cogs"
					color="default"
				></v-icon>
				<v-icon
					v-if="item.type === 'ds'"
					icon="mdi-cable-data"
				></v-icon>
				<v-icon
					v-if="item.type === 'cs'"
					icon="mdi-controller"
				></v-icon>
			</template>
			<!-- Actions -->
			<template v-slot:append="{ item }">
				<!-- Remove node -->
				<DeleteButton
					v-if="item.type === 'node'"
					text="Delete"
					location="bottom"
					label="Remove"
					@delete="openDeleteNodeDialog(item.raw)"
				></DeleteButton>
				<!-- FOIs -->
				<div v-else-if="item.type === 'system'">
					<!-- No FOI compatability -->
					<v-tooltip
						v-if="!hasFOIs(item.raw as OSHSystem)"
						text="No FOIs exist on this system"
						location="bottom"
						open-delay="500"
					>
						<template #activator="{ props }">
							<IconButton
								v-bind="props"
								icon="mdi-map-marker-alert-outline"
								variant="plain"
								class="properties-button"
							>
							</IconButton>
						</template>
					</v-tooltip>
					<!-- Remove / Edit FOI -->
					<div v-else-if="visualizationStore.FOIExists(item.id)">
						<v-tooltip
							text="Customize FOI"
							location="bottom"
							open-delay="500"
						>
							<template #activator="{ props }">
								<IconButton
									v-bind="props"
									icon="mdi-palette"
									variant="text"
									class="properties-button"
									@click="openFoiStyleDialog(item.raw)"
								></IconButton>
							</template>
						</v-tooltip>
						<v-tooltip
							text="Delete FOI"
							location="bottom"
							open-delay="500"
							><template #activator="{ props }">
								<IconButton
									v-bind="props"
									icon="mdi-map-marker-minus"
									variant="text"
									class="properties-button"
									@click="visualizationStore.removeFOILayer(item.id)"
								>
								</IconButton>
							</template>
						</v-tooltip>
					</div>
					<!-- Add FOI -->
					<v-tooltip
						v-else
						text="Add FOI"
						location="bottom"
						open-delay="500"
					>
						<template #activator="{ props }">
							<IconButton
								v-bind="props"
								icon="mdi-map-marker-plus"
								variant="text"
								class="properties-button"
								@click="addFOILayer(item.raw as OSHSystem)"
							>
							</IconButton>
						</template>
					</v-tooltip>
				</div>
				<!-- DS/CS properties -->
				<v-tooltip
					v-else-if="item.type === 'ds' || item.type === 'cs'"
					text="Properties"
					location="bottom"
					open-delay="500"
				>
					<template #activator="{ props }">
						<IconButton
							v-bind="props"
							icon="mdi-dots-vertical"
							variant="plain"
							@click="openPropertiesDialog(item.raw)"
							class="properties-button"
						>
						</IconButton>
					</template>
				</v-tooltip>
			</template>
		</v-treeview>
	</v-sheet>

	<!-- DIALOGS -->
	<v-dialog
		v-model="uiStore.deleteNodeDialog"
		max-width="500"
	>
		<DeleteNodeDialog :node="nodeToDelete" />
	</v-dialog>
	<v-dialog
		v-model="uiStore.nodeConfigFormOpen"
		max-width="540"
	>
		<NodeConfigForm />
	</v-dialog>
	<v-dialog
		v-model="uiStore.propertiesDialog"
		max-width="540"
	>
		<PropertiesDialog
			v-if="propertiesRef"
			:item="propertiesRef"
		/>
	</v-dialog>
	<v-dialog
		v-model="uiStore.foiStyleDialog"
		max-width="540"
	>
		<FoiStyleDialog
			v-if="foiRef"
			:system="foiRef"
		/>
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

.properties-button {
	opacity: 0;
	transition: opacity 0.1s ease-in-out;
}

.v-list-item:hover .properties-button {
	opacity: 1;
}
</style>
