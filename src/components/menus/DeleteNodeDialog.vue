<script lang="ts" setup>
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
  return visualizationStore.visualizations.filter(viz => 
    viz.datastream?.some(ds => ds.getParentNode().getEndpointUrl() === props.node?.getEndpointUrl()) ||
    viz.controlstream?.some(cs => cs.getParentNode().getEndpointUrl() === props.node?.getEndpointUrl())
  );
});

const deleteNode = () => {
  if (!props.node) { close(); return; }

  // Delete node from store
  nodeStore.removeNode(props.node);

  // Delete visualizations associated with this node
  visualizationStore.visualizations.forEach((viz) => {
    // Check datastreams for this node
    viz.datastream?.forEach((ds) => {
      if (ds.getParentNode() === props.node) {
        visualizationStore.removeVisualization(viz);
        console.log("Removing viz:", viz, "because of datastream:", ds);
        return;
      }
    });
    // Check controlstreams for this node
    viz.controlstream?.forEach((cs) => {
      if (cs.getParentNode() === props.node) {
        visualizationStore.removeVisualization(viz);
        console.log("Removing viz:", viz, "because of controlstream:", cs);
        return;
      }
    });
  });

  console.log('Deleted node:', props.node);
  close();
};

const close = () => {
  uiStore.toggleDeleteNodeDialog();
};

</script>
<template>
  <v-card class="pa-2 ma-2" width="100%" height="100%" elevation="2">
    <v-card-title>Delete node?</v-card-title>
    <v-card-text>
      <p>This will remove all associated visualizations and cannot be undone.</p>
      <v-divider class="my-2"></v-divider>
      <div v-if="listVizToDelete.length > 0" class="pl-4">
        <ul>
          <li v-for="viz in listVizToDelete" :key="viz.id">
            {{ viz.name }}
          </li>
        </ul>
      </div>
      <div v-else class="mt-4 mb-2">
        There are no visualizations associated with this node.
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn type="submit" color="error" @click="deleteNode">Delete Node</v-btn>
      <v-btn text @click="close">Cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>
<style scoped></style>