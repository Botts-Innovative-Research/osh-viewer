<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import { useComponentValidation } from '../../wizard/composables/useComponentValidation';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';

// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  sampleRate: computed({
    get: () => vizwizStore.dsConfig.sampleRate?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("sampleRate", { selected: val })
  }),
  samples: computed({
    get: () => vizwizStore.dsConfig.samples?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("samples", { selected: val })
  }),
})

// Initialize dsConfig with sampleRate and samples selected by default when mounted
onMounted(() => {
  if (!vizwizStore.dsConfig.sampleRate) {
    vizwizStore.updateDsConfig("sampleRate", { selected: true })
  }
  if (!vizwizStore.dsConfig.samples) {
    vizwizStore.updateDsConfig("samples", { selected: true })
  }
})

// If dsConfig is reset, ensure x and y are selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.sampleRate) {
    vizwizStore.updateDsConfig("sampleRate", { selected: true })
  }
  if (!newVal.samples) {
    vizwizStore.updateDsConfig("samples", { selected: true })
  }
}, { deep: true })

// Validation: at least Sample Rate and Samples must be selected and configured
const emit = defineEmits<VisualizationComponentEmits>()
const roleSampleRateValid = ref<boolean>(false)
const roleSamplesValid = ref<boolean>(false)
const valid = computed(() => {
  // If role is checked, must be valid. If not checked, ignore validity
  const srValid = checkedRoles.sampleRate ? roleSampleRateValid.value : true
  const sValid = checkedRoles.samples ? roleSamplesValid.value : true
  return srValid && sValid
})
useComponentValidation(valid, emit)

</script>
<template>
  <!-- Sample Rate -->
  <v-container>
    <v-checkbox label="Sample Rate" v-model="checkedRoles.sampleRate" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.sampleRate" role="sampleRate" v-model:valid="roleSampleRateValid" />
  </v-container>

  <!-- Samples -->
  <v-container>
    <v-checkbox label="Samples" v-model="checkedRoles.samples" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.samples" role="samples" v-model:valid="roleSamplesValid" />
  </v-container>
</template>

<style scoped></style>