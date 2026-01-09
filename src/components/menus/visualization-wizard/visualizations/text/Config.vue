<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed, reactive, watch, ReactiveEffect, onMounted } from 'vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';


// Retrieve datastreams
const vizwizStore = useVizWizStore()

// Checked status for each role
const checkedRoles = reactive({
  stream: computed({
    get: () => vizwizStore.dsConfig.stream?.selected ?? true,
    set: (val: boolean) => vizwizStore.updateDsConfig("stream", { selected: val })
  }),
})

// Initialize dsConfig with x and y selected by default when mounted
onMounted(() => {
  console.log("Mounted Text Config")
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

</script>
<template>
  <!-- Stream -->
  <v-container>
    <v-checkbox label="Stream" v-model="checkedRoles.stream" disabled></v-checkbox>
    <DataSourcePicker v-if="checkedRoles.stream" role="stream" multiple/>
  </v-container>
</template>

<style scoped></style>