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
	<v-list>
		<v-list-item>
      <v-select
          v-model="selectedNode"
          :items="listNodes"
          label="Select node to save state to"
          persistent-hint
          item-title="name"
          item-value="id"
      />
		</v-list-item>

    <v-list-item>
      <v-btn block variant="flat" color="success" @click="handleSave"> Save State</v-btn>
    </v-list-item>
	</v-list>
</template>

<style scoped>
</style>
