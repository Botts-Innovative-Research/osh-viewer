<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted } from 'vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";

// Retrieve controlstreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  plan: computed({
    get: () => vizwizStore.csConfig.plan?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("plan", { selected: val })
  }),
  land: computed({
    get: () => vizwizStore.csConfig.land?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("land", { selected: val })
  }),
  pause: computed({
    get: () => vizwizStore.csConfig.pause?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("pause", { selected: val })
  }),
  rtl: computed({
    get: () => vizwizStore.csConfig.rtl?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("rtl", { selected: val })
  }),
  offboard: computed({
    get: () => vizwizStore.csConfig.offboard?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("offboard", { selected: val })
  }),
})

// Initialize csConfig with selected by default when mounted
onMounted(() => {
  if (!vizwizStore.csConfig.plan) {
    vizwizStore.updateCsConfig("plan", { selected: true })
  }

  if (!vizwizStore.csConfig.land) {
    vizwizStore.updateCsConfig("land", { selected: true })
  }

  if (!vizwizStore.csConfig.pause) {
    vizwizStore.updateCsConfig("pause", { selected: true })
  }

  if (!vizwizStore.csConfig.rtl) {
    vizwizStore.updateCsConfig("rtl", { selected: true })
  }

  if (!vizwizStore.csConfig.offboard) {
    vizwizStore.updateCsConfig("offboard", { selected: true })
  }
})

// If csConfig is reset, ensure  is selected by default
watch(() => vizwizStore.csConfig, (newVal) => {
  if (!newVal.plan) {
    vizwizStore.updateCsConfig("plan", { selected: true })
  }

  if (!newVal.pause) {
    vizwizStore.updateCsConfig("pause", { selected: true })
  }

  if (!newVal.rtl) {
    vizwizStore.updateCsConfig("rtl", { selected: true })
  }

  if (!newVal.land) {
    vizwizStore.updateCsConfig("land", { selected: true })
  }

  if (!newVal.offboard) {
    vizwizStore.updateCsConfig("offboard", { selected: true })
  }

}, { deep: true })

</script>
<template>
  <v-container>
    <v-checkbox label="Mission Control Plan" v-model="checkedRoles.plan" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.plan" role="plan"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Pause Mission" v-model="checkedRoles.pause" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.pause" role="pause"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Return to Launch" v-model="checkedRoles.rtl" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.rtl" role="rtl"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Land Mission" v-model="checkedRoles.land" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.land" role="land"  :show-property-selector="false"/>
  </v-container>

  <v-container>
    <v-checkbox label="Offboard Control" v-model="checkedRoles.offboard" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.offboard" role="offboard"  :show-property-selector="false"/>
  </v-container>
</template>

<style scoped></style>