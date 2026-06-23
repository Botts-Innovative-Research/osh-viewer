<script lang="ts" setup>
import { showToast } from '@/composables/useToast';
import { OSHNode } from '@/lib/OSHConnectDataStructs';
import { useNodeStore } from '@/stores/nodestore';
import { useUIStore } from '@/stores/uistore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { computed } from 'vue';

const props = defineProps<{
	node: OSHNode | null;
}>();

const uiStore = useUIStore();
const nodeStore = useNodeStore();
const visualizationStore = useVisualizationStore();

const listVizToDelete = computed(() => {
	if (!props.node) return [];

	// Match endpoint URL to check if any datastreams or controlstreams belong to this node
	return visualizationStore.visualizations.filter(
		(viz) =>
			viz.datastream?.some(
				(ds) => ds.getParentNode().getEndpointUrl() === props.node?.getEndpointUrl()
			) ||
			viz.controlstream?.some(
				(cs) => cs.getParentNode().getEndpointUrl() === props.node?.getEndpointUrl()
			)
	);
});

const deleteNode = () => {
	if (!props.node) {
		close();
		return;
	}

	// Delete node from store
	nodeStore.removeNode(props.node);

	// Delete visualizations associated with this node
	listVizToDelete.value.forEach((viz) => {
		// Check datastreams for this node
		viz.datastream?.forEach((ds) => {
			if (ds.getParentNode() === props.node) {
				visualizationStore.removeVisualization(viz);
				return;
			}
		});
		// Check controlstreams for this node
		viz.controlstream?.forEach((cs) => {
			if (cs.getParentNode() === props.node) {
				visualizationStore.removeVisualization(viz);
				return;
			}
		});
	});

	showToast('Node deleted', 'SUCCESS');
	close();
};

const close = () => {
	uiStore.toggleDeleteNodeDialog();
};
</script>
<template>
	<v-card>
		<v-card-item>
			<v-card-title
				>Delete <b>{{ props.node?.name }}</b> node?</v-card-title
			>
		</v-card-item>
		<v-card-text>
			<p>This will remove all associated visualizations and cannot be undone.</p>
			<v-divider class="my-2"></v-divider>
			<div v-if="listVizToDelete.length > 0">
				<ul>
					<li
						v-for="viz in listVizToDelete"
						:key="viz.id"
					>
						{{ viz.name }}
					</li>
				</ul>
			</div>
			<div
				v-else
				class="my-4 mb-2"
			>
				There are no visualizations associated with this node.
			</div>
		</v-card-text>
		<v-card-actions>
			<v-btn
				text
				@click="close"
				>Cancel</v-btn
			>
			<v-btn
				type="submit"
				color="error"
				variant="flat"
				@click="deleteNode"
				>Delete Node</v-btn
			>
		</v-card-actions>
	</v-card>
</template>
<style scoped></style>
