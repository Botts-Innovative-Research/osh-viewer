<script setup lang="ts">
import {
  fetchSchema,
  mineDatasourceObsPropsFromDS,
} from '@/lib/DatasourceUtils';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  role: string, // Property role to be used as key in vizwiz store
}>()

// Get datastreams from vizwiz store
const vizwizStore = useVizWizStore()
const listDatastreams = computed(() => {
  return vizwizStore.datastreams
})

console.log("vizwizStore.dsConfig[props.role]", vizwizStore.dsConfig)
// Update selected datastream for this role in vizwiz store
const selectedDatastream = computed({
  get: () => vizwizStore.dsConfig[props.role]?.dsId,
  set: (val: string) => vizwizStore.updateDsConfig(props.role, { dsId: val, property: null })
})

const selectedProperty = computed({
  get: () => vizwizStore.dsConfig[props.role]?.label,
  set: (val: any) => (vizwizStore.updateDsConfig(props.role, { property: val.name, label: val.label ?? val.name, uom: val.uom?.code ?? '' }))
})

// Properties schema for selected datastream
const dsSchema = ref<any>(null)

// Fetch datasource observed properties
async function fetchProps() {
  const { ds, observedProps } = mineDatasourceObsPropsFromDS(selectedDatastream.value)
  dsSchema.value = await fetchSchema(ds.datastream)

  console.log(dsSchema.value)
  console.log('[DataSourcePicker] ds.datastream.properties:', ds.datastream.properties)
  console.log('[DataSourcePicker] outputName:', ds.datastream.properties.outputName)
  vizwizStore.updateDsConfig(props.role, { outputName: ds.datastream.properties.outputName })
  console.log('[DataSourcePicker] dsConfig after update:', JSON.stringify(vizwizStore.dsConfig, null, 2))
}

// Watch for changes in selected datastream to update properties
watch(selectedDatastream, async (newVal) => {
  if (!newVal) return
  await fetchProps()
})



</script>

<template>
  <!-- Select for datastreams -->
  <v-select v-model="selectedDatastream" :items="listDatastreams" label="Select datastream" persistent-hint
    item-title="name" item-value="id"></v-select>

  <!-- Select for property -->
  <v-select v-if="dsSchema && dsSchema.recordSchema" v-model="selectedProperty" :items="dsSchema.recordSchema.fields"
    label="Select property" :item-title="(item: any) => item.label || item.name" persistent-hint
    :item-value="(item: any) => item"></v-select>
</template>

<style scoped></style>
