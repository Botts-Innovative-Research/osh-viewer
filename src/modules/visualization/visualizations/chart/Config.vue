<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import { useComponentValidation } from '../../../../components/menus/visualization-wizard/shared/helpers';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';

// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  x: computed({
    get: () => vizwizStore.dsConfig.x?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("x", { selected: val })
  }),
  y: computed({
    get: () => vizwizStore.dsConfig.y?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("y", { selected: val })
  }),
})

// Initialize dsConfig with x and y selected by default when mounted
onMounted(() => {
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

// Validation: at least x and y must be selected and configured
const emit = defineEmits<VisualizationComponentEmits>()
const roleXValid = ref<boolean>(false)
const roleYValid = ref<boolean>(false)
const valid = computed(() => {
  // If role is checked, must be valid. If not checked, ignore validity
  const xValid = checkedRoles.x ? roleXValid.value : true
  const yValid = checkedRoles.y ? roleYValid.value : true
  return xValid && yValid
})
useComponentValidation(valid, emit)

</script>
<template>
  <!-- X -->
  <v-container>
    <v-checkbox label="X Axis" v-model="checkedRoles.x" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.x" role="x" v-model:valid="roleXValid" />
  </v-container>

  <!-- Y -->
  <v-container>
    <v-checkbox label="Y Axis" v-model="checkedRoles.y" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.y" role="y" v-model:valid="roleYValid" multiple />
  </v-container>
</template>

<style scoped></style>