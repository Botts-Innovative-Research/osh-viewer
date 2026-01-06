<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  x: computed({
    get: () => vizwizStore.dsConfig.x?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("x", { selected: val })
  }),
  y: computed({
    get: () => vizwizStore.dsConfig.y?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateDsConfig("y", { selected: val })
  }),
})

// Initialize dsConfig with x and y selected by default when mounted
onMounted(() => {
  console.log("Mounted Chart Config")
  if (!vizwizStore.dsConfig.x) {
    vizwizStore.updateDsConfig("x", { selected: true })
  }
  if (!vizwizStore.dsConfig.y) {
    vizwizStore.updateDsConfig("y", { selected: true })
  }
})

// If dsConfig is reset, ensure x and y are selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.x) {
    vizwizStore.updateDsConfig("x", { selected: true })
  }
  if (!newVal.y) {
    vizwizStore.updateDsConfig("y", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <!-- X -->
  <v-container>
    <v-checkbox label="X Axis" v-model="checkedRoles.x" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.x" role="x" />
  </v-container>

  <!-- Y -->
  <v-container>
    <v-checkbox label="Y Axis" v-model="checkedRoles.y"></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.y" role="y" />
  </v-container>
</template>

<style scoped></style>