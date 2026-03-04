<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  location: computed({
    get: () => vizwizStore.dsConfig.location?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("location", { selected: val })
  }),
  orientation: computed({
    get: () => vizwizStore.dsConfig.orientation?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateDsConfig("orientation", { selected: val })
  }),
  markerId: computed({
    get: () => vizwizStore.dsConfig.markerId?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateDsConfig("markerId", { selected: val })
  }),
})

// Initialize dsConfig with location selected by default when mounted
onMounted(() => {
  console.log("Mounted Pointmarker Config")
  if (!vizwizStore.dsConfig.location) {
    vizwizStore.updateDsConfig("location", { selected: true })
  }
})

// If dsConfig is reset, ensure location is selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.location) {
    vizwizStore.updateDsConfig("location", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <!-- Location -->
  <v-container>
    <v-checkbox label="Location" v-model="checkedRoles.location" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.location" role="location" />
  </v-container>

  <!-- Orientation -->
  <v-container>
    <v-checkbox label="Orientation" v-model="checkedRoles.orientation"></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.orientation" role="orientation" />
  </v-container>

  <!-- Marker ID -->
  <v-container>
    <v-checkbox label="Marker ID" v-model="checkedRoles.markerId"></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.markerId" role="markerId" />
  </v-container>
</template>

<style scoped></style>