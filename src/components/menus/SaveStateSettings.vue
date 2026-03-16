<script setup lang="ts">

import {useNodeStore} from "@/stores/nodestore";
import {computed, watch} from "vue";
import {useConfigPersistence} from "@/composables/useConfigPersistence";

const nodeStore = useNodeStore();
const { saveConfig } = useConfigPersistence();

const emit = defineEmits(['saved']);

async function handleSave() {
  const success = await saveConfig();
  if (success) {
    emit('saved');
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
    <v-card-title>Save State</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="handleSave">
        <v-select
          v-model="selectedNode"
          :items="listNodes"
          label="Select node to save state to"
          persistent-hint
          item-title="name"
          item-value="id"
        />
        <v-card-actions>
          <v-btn block type="submit" color="success" variant="tonal">Save State</v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped>
</style>
