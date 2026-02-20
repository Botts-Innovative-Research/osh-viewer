<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted } from 'vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";
import DataSourcePicker from "@/components/menus/visualization-wizard/viz-components/DataSourcePicker.vue";

// Retrieve controlstreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  home: computed({
    get: () => vizwizStore.dsConfig.home?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("home", { selected: val })
  }),
  lla: computed({
    get: () => vizwizStore.dsConfig.lla?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("lla", { selected: val })
  }),
  qgc: computed({
    get: () => vizwizStore.csConfig.qgc?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("qgc", { selected: val })
  }),
  plan: computed({
    get: () => vizwizStore.csConfig.plan?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateCsConfig("plan", { selected: val })
  }),
  land: computed({
    get: () => vizwizStore.csConfig.land?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("land", { selected: val })
  }),
  pause: computed({
    get: () => vizwizStore.csConfig.pause?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("pause", { selected: val })
  }),
  rtl: computed({
    get: () => vizwizStore.csConfig.rtl?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("rtl", { selected: val })
  }),
  offboard: computed({
    get: () => vizwizStore.csConfig.offboard?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("offboard", { selected: val })
  }),
  takeoff: computed({
    get: () => vizwizStore.csConfig.takeoff?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("takeoff", { selected: val })
  }),
  cancel: computed({
    get: () => vizwizStore.csConfig.cancel?.selected ?? false,
    set: (val: boolean) => vizwizStore.updateCsConfig("cancel", { selected: val })
  }),
})

// Initialize csConfig with selected by default when mounted
onMounted(() => {
  if (!vizwizStore.csConfig.qgc) {
    vizwizStore.updateCsConfig("qgc", { selected: true })
  }

  if (!vizwizStore.csConfig.plan) {
    vizwizStore.updateCsConfig("plan", { selected: true })
  }

  if (!vizwizStore.dsConfig.lla) {
    vizwizStore.updateDsConfig("lla", { selected: true })
  }

  if (!vizwizStore.dsConfig.home) {
    vizwizStore.updateDsConfig("home", { selected: true })
  }
})

// If csConfig is reset, ensure  is selected by default
watch(() => vizwizStore.csConfig, (newVal) => {
  if (!newVal.plan) {
    vizwizStore.updateCsConfig("plan", { selected: true })
  }
  if (!newVal.qgc) {
    vizwizStore.updateCsConfig("qgc", { selected: true })
  }
}, { deep: true })

watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.home) {
    vizwizStore.updateDsConfig("home", { selected: true })
  }
  if (!newVal.lla) {
    vizwizStore.updateDsConfig("lla", { selected: true })
  }
}, { deep: true })

</script>
<template>

  <v-container>
    <v-checkbox label="Location" v-model="checkedRoles.lla" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.lla" role="lla"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Home Location" v-model="checkedRoles.home" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.home" role="home"  :show-property-selector="false" />
  </v-container>


  <v-container>
    <v-checkbox label="Mission Control Plan" v-model="checkedRoles.plan" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.plan" role="plan"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="QGCPlan" v-model="checkedRoles.qgc" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.plan" role="qgc"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Takeoff Control" v-model="checkedRoles.takeoff"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.takeoff" role="takeoff"  :show-property-selector="false"/>
  </v-container>

  <v-container>
    <v-checkbox label="Land Mission" v-model="checkedRoles.land"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.land" role="land"  :show-property-selector="false"/>
  </v-container>

  <v-container>
    <v-checkbox label="Pause Mission" v-model="checkedRoles.pause"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.pause" role="pause"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Return to Launch" v-model="checkedRoles.rtl"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.rtl" role="rtl"  :show-property-selector="false" />
  </v-container>

  <v-container>
    <v-checkbox label="Offboard Control" v-model="checkedRoles.offboard"></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.offboard" role="offboard"  :show-property-selector="false"/>
  </v-container>

</template>

<style scoped></style>