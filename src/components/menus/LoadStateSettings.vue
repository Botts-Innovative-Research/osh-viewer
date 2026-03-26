<script setup lang="ts">

import {useNodeStore} from "@/stores/nodestore";
import {computed, watch} from "vue";
import {useConfigPersistence} from "@/composables/useConfigPersistence";

const nodeStore = useNodeStore();
const { loadConfig } = useConfigPersistence();

const emit = defineEmits(['load']);

async function handleLoad() {
  const success = await loadConfig('save2');
  if (success) {
    emit('load');
  }
}

const listNodes = computed(() => {
  return nodeStore.nodes.map(node => ({
    ...node,
    id: `${node.host}:${node.port}`
  }))
})

const selectedNode = computed({
  get: () => nodeStore.defaultNodeId,
  set: (val) => nodeStore.updateDefaultNode(val)
})

</script>

<template>
  <v-card class="pa-2">
    <v-card-title>Load State</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="handleLoad">
        <v-select
          v-model="selectedNode"
          :items="listNodes"
          label="Select node to load state from"
          persistent-hint
          item-title="name"
          item-value="id"
        />
        <v-card-actions>
          <v-btn block type="submit" color="success" variant="tonal">Load State</v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped>
</style>
