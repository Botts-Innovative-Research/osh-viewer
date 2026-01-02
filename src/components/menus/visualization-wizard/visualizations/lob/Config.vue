<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  origin: computed({
    get: () => vizwizStore.dsConfig.origin?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("origin", { selected: val })
  }),
  bearing: computed({
    get: () => vizwizStore.dsConfig.bearing?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("bearing", { selected: val })
  }),
})

// Initialize dsConfig with origin and bearing selected by default when mounted
onMounted(() => {
  console.log("Mounted PM Orientation Config")
  if (!vizwizStore.dsConfig.origin) {
    vizwizStore.updateDsConfig("origin", { selected: true })
  }
  if (!vizwizStore.dsConfig.bearing) {
    vizwizStore.updateDsConfig("bearing", { selected: true })
  }
})

// If dsConfig is reset, ensure origin and bearing are selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.origin) {
    vizwizStore.updateDsConfig("origin", { selected: true })
  }
  if (!newVal.bearing) {
    vizwizStore.updateDsConfig("bearing", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <!-- Origin -->
  <v-container>
    <v-checkbox label="Origin" v-model="checkedRoles.origin" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.origin" role="origin" />
  </v-container>

  <!-- Bearing -->
  <v-container>
    <v-checkbox label="Bearing" v-model="checkedRoles.bearing" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.bearing" role="bearing" />
  </v-container>
</template>

<style scoped></style>