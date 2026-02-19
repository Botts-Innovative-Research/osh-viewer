<script setup lang="ts">

import {useNodeStore} from "@/stores/nodestore";
import {computed, watch} from "vue";
import {useConfigPersistence} from "@/composables/useConfigPersistence";

const nodeStore = useNodeStore();
const { loadConfig } = useConfigPersistence();

const emit = defineEmits(['load']);

async function handleLoad() {
  const success = await loadConfig();
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
	<v-list>
		<v-list-item>
      <v-select
          v-model="selectedNode"
          :items="listNodes"
          label="Select node to load state from"
          persistent-hint
          item-title="name"
          item-value="id"
      />
		</v-list-item>

    <v-list-item>
      <v-btn
          block
          variant="flat"
           color="success"
           @click="handleLoad"
      >
        Load State
      </v-btn>
    </v-list-item>
	</v-list>
</template>

<style scoped>
</style>
