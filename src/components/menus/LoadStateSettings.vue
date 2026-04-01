<script setup lang="ts">
import {useNodeStore} from "@/stores/nodestore";
import { computed, onMounted, ref, watch } from "vue";
import {useConfigPersistence} from "@/composables/useConfigPersistence";

const nodeStore = useNodeStore();
const { loadConfig, listConfigs } = useConfigPersistence();

const emit = defineEmits(['load']);

// Config list state
const availableConfigs = ref<string[]>([]);
const selectedConfig = ref<string>('');
const loadingConfigs = ref(false);

async function fetchConfigs() {
  loadingConfigs.value = true;
  availableConfigs.value = await listConfigs();
  loadingConfigs.value = false;
}

function itemProps(item: any) {
  return {
    title: item.name,
    subtitle: item.description,
    value: item.name,
  }
}

async function handleLoad() {
  const success = await loadConfig(selectedConfig.value);
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

// Re-fetch configs when selected node changes
watch(selectedNode, fetchConfigs)

// Fetch on mount
onMounted(fetchConfigs);

</script>

<template>
  <v-card class="pa-2">
    <v-card-title>Load State</v-card-title>
    <v-card-text>
      <v-alert text="Loading a saved state will delete all current visualizations" type="warning"
        class="mb-4"></v-alert>
      <v-form @submit.prevent="handleLoad">
        <v-select
          v-model="selectedNode"
          :items="listNodes"
          label="Select node to load state from"
          persistent-hint
          item-title="name"
          item-value="id"
        />
        <v-select v-model="selectedConfig" :items="availableConfigs" :item-props="itemProps" :loading="loadingConfigs"
          :disabled="loadingConfigs" label="Select saved configuration" persistent-hint
          no-data-text="No saved configurations found" />
        <v-card-actions>
          <v-btn block type="submit" color="success" variant="tonal" :disabled="!selectedConfig || loadingConfigs">Load
            State</v-btn>
        </v-card-actions>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped>
</style>
