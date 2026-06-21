<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
import DeleteNodeDialog from '@/components/menus/DeleteNodeDialog.vue';
import NodeConfigForm from '@/components/menus/NodeConfigForm.vue';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import PropertiesDialog from '@/modules/system-browser/PropertiesDialog.vue';
import NodeIcon from '@/components/icons/node-logo.svg';
import FoiStyleDialog from './FoiStyleDialog.vue';

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

const addFOILayer = (system: OSHSystem) => {
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
		visualizationStore.addFOILayer(geom);
	});
};

const addAllFOIs = () => {
	systems.forEach((system: OSHSystem) => {
		addFOILayer(system);
	});
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
		<v-sheet class="pb-4">
			<div class="mb-2 pa-2">
				<v-tooltip
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
					</template>
				</v-tooltip>
				<v-tooltip
					text="Create FOI pointmarkers"
					location="bottom"
				>
					<template v-slot:activator="{ props }">
						<v-btn
							@click="addAllFOIs"
							v-bind="props"
							prepend-icon="mdi-map-marker"
							>All FOIs</v-btn
						>
					</template>
				</v-tooltip>
			</div>
			<!-- Add Node -->
			<v-btn
				block
				prepend-icon="mdi-plus-circle"
				variant="flat"
				color="success"
				@click="openNodeConfig"
			>
				Add Node
			</v-btn>
		</v-sheet>

		<v-divider></v-divider>

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
