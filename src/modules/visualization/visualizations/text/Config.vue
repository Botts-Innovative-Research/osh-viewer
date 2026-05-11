<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, reactive, watch, onMounted, ref } from 'vue';
import DataSourcePicker from '../../wizard/components/DataSourcePicker.vue';
import { VisualizationComponentEmits } from '../../registry/VisualizationRegistry';
import { useComponentValidation } from '../../../../components/menus/visualization-wizard/shared/helpers';


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  stream: computed({
    get: () => vizwizStore.dsConfig.stream?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("stream", { selected: val })
  }),
})

// Initialize dsConfig with stream selected by default when mounted
onMounted(() => {
  if (!vizwizStore.dsConfig.stream) {
    vizwizStore.updateDsConfig("stream", { selected: true })
  }
})

// If dsConfig is reset, ensure stream is selected by default
watch(() => vizwizStore.dsConfig, (newVal) => {
  if (!newVal.stream) {
    vizwizStore.updateDsConfig("stream", { selected: true })
  }
}, { deep: true })

// Validation: at least datasource must be selected and configured
const emit = defineEmits<VisualizationComponentEmits>()
const dsValid = ref<boolean>(false)
const valid = computed(() => {
  return checkedRoles.stream ? dsValid.value : true
})
useComponentValidation(valid, emit)

</script>
<template>
  <!-- Stream -->
  <v-container>
    <v-checkbox label="Stream" v-model="checkedRoles.stream" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.stream" role="stream" multiple v-model:valid="dsValid"/>
  </v-container>
</template>

<style scoped></style>