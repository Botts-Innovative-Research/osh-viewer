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
})

// Initialize csConfig with selected by default when mounted
onMounted(() => {
  console.log("Mounted Config")
  if (!vizwizStore.csConfig.path) {
    vizwizStore.updateCsConfig("path", { selected: true })
  }
})

// If dsConfig is reset, ensure  is selected by default
watch(() => vizwizStore.csConfig, (newVal) => {
  if (!newVal.path) {
    vizwizStore.updateCsConfig("path", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <v-container>
    <v-checkbox label="FlightPath Control" v-model="checkedRoles.path" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.path" role="path" />
  </v-container>
</template>

<style scoped></style>