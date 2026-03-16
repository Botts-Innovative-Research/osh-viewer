<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted, ref } from 'vue';
import ControlStreamPicker from "@/components/menus/visualization-wizard/viz-components/ControlStreamPicker.vue";
import { VisualizationComponentEmits } from '../../VisualizationRegistry';
import { useComponentValidation } from '../../shared/helpers';

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

// Validation: CS must be configured
const emit = defineEmits<VisualizationComponentEmits>()
const csValid = ref<boolean>(false)
const valid = computed(() => {
  return checkedRoles.lla ? csValid.value : true
})
useComponentValidation(valid, emit)

</script>
<template>
  <!-- GeoPTZ -->
  <v-container>
    <v-checkbox label="GeoPTZ Control" v-model="checkedRoles.lla" disabled></v-checkbox>
    <ControlStreamPicker v-if="checkedRoles.lla" role="lla" :show-property-selector="false" v-model:valid="csValid" />
  </v-container>
</template>

<style scoped></style>