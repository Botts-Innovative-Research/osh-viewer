<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, defineProps, computed, reactive, watch } from 'vue';
import TimePickers from '../../viz-components/TimePickers.vue';
import DataSourcePicker from '../../viz-components/DataSourcePicker.vue';
import { SchemaFieldProperty } from '@/lib/DatasourceUtils';

const props = defineProps<({
})>()

// Holds selected properties per datastream
const selectedPropertiesByDs = reactive<{ [dsId: string]: SchemaFieldProperty[] }>({})

// Retrieve datastreams
const vizwizStore = useVizWizStore()
const listDatastreams = computed(() => {
  return vizwizStore.datastreams
})

const config = reactive({
  playbackMode: { "label": "REAL TIME", "value": "realTime" } // Set default to real time
})

listDatastreams.value.forEach(ds => {
  // Initialize array for each datastream
  if (!selectedPropertiesByDs[ds.id]) selectedPropertiesByDs[ds.id] = []

  // Watch each datastream individually
  watch(() => selectedPropertiesByDs[ds.id], (newVal) => {
    console.log(`Datastream ${ds.id} changed:`, newVal)
    vizwizStore.updateDsConfig(ds.id, { selectedProperties: newVal })
  }, { deep: true })
})

</script>
<template>
  <!-- SELECT PROPERTIES -->
  <div v-for="datastream in listDatastreams">
    <h3>{{ datastream.name }}</h3>
    <DataSourcePicker :currentDs="datastream" v-model="selectedPropertiesByDs[datastream.id]" />
  </div>
  <!-- TIME PICKERS & PLAYBACK MODE -->
  <TimePickers />
</template>