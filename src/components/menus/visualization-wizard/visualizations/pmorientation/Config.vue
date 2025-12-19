<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, defineProps, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import TimePickers from '../../viz-components/TimePickers.vue';
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
})

// Initialize dsConfig with location selected by default when mounted
onMounted(() => {
  if (!vizwizStore.dsConfig.location) {
    vizwizStore.updateDsConfig("location", { selected: true })
  }
})



const config = reactive({
  playbackMode: { "label": "REAL TIME", "value": "realTime" } // Set default to real time
})


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
  <!-- TODO: Add code for MarkerID -->

  <!-- TIME PICKERS & PLAYBACK MODE -->
  <TimePickers />
</template>

<style scoped>
</style>