<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  video: computed({
    get: () => vizwizStore.dsConfig.video?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("video", { selected: val })
  }),
  ptz: computed({
    get: () => vizwizStore.csConfig.ptz?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("ptz", { selected: val })
  }),
})

// Initialize dsConfig with video selected by default when mounted
onMounted(() => {
  console.log("Mounted Video Config")
  if (!vizwizStore.dsConfig.video) {
    vizwizStore.updateDsConfig("video", { selected: true })
  }
})

// If dsConfig is reset, ensure video is selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.video) {
    vizwizStore.updateDsConfig("video", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <!-- Video -->
  <v-container>
    <v-checkbox label="Video" v-model="checkedRoles.video" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.video" role="video" />
  </v-container>
  <!-- PTZ -->
  <v-container>
    <v-checkbox label="PTZ Control" v-model="checkedRoles.ptz"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.ptz" role="ptz" />
  </v-container>
</template>

<style scoped></style>