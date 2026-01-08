<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted } from 'vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";

// Retrieve controlstreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  lla: computed({
    get: () => vizwizStore.csConfig.lla?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("lla", { selected: val })
  }),
})

// Initialize csConfig with geo ptz selected by default when mounted
onMounted(() => {
  console.log("Mounted GeoPTZ Config")
  if (!vizwizStore.csConfig.lla) {
    vizwizStore.updateCsConfig("lla", { selected: true })
  }
})

// If dsConfig is reset, ensure geoptz is selected by default
watch(() => vizwizStore.csConfig, (newVal) => {
  if (!newVal.lla) {
    vizwizStore.updateCsConfig("lla", { selected: true })
  }
}, { deep: true })

</script>
<template>
  <!-- GeoPTZ -->
  <v-container>
    <v-checkbox label="GeoPTZ Control" v-model="checkedRoles.lla" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.lla" role="lla" />
  </v-container>
</template>

<style scoped></style>