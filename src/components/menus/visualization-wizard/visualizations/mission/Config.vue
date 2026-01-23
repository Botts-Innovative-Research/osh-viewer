<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted } from 'vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";

// Retrieve controlstreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  path: computed({
    get: () => vizwizStore.csConfig.path?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("path", { selected: val })
  }),
  cancel: computed({
    get: () => vizwizStore.csConfig.cancel?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("cancel", { selected: val })
  }),
})

// Initialize csConfig with selected by default when mounted
onMounted(() => {
  if (!vizwizStore.csConfig.path) {
    vizwizStore.updateCsConfig("path", { selected: true })
  }
  if (!vizwizStore.csConfig.cancel) {
    vizwizStore.updateCsConfig("cancel", { selected: true })
  }
})

// If dsConfig is reset, ensure  is selected by default
watch(() => vizwizStore.csConfig, (newVal) => {
  if (!newVal.path) {
    vizwizStore.updateCsConfig("path", { selected: true })
  }
  if (!newVal.cancel) {
    vizwizStore.updateCsConfig("cancel", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <v-container>
    <v-checkbox label="Mission Control" v-model="checkedRoles.path" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.path" role="path" />
  </v-container>

  <v-container>
    <v-checkbox label="Cancel Mission Control" v-model="checkedRoles.cancel" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.cancel" role="cancel" />
  </v-container>
</template>

<style scoped></style>