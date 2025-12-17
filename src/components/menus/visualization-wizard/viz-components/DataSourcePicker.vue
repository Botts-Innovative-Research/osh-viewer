<script setup lang="ts">
import { fetchSchema, mineDatasourceObsPropsFromDS, SchemaFieldProperty } from '@/lib/DatasourceUtils'
import { OSHDatastream } from '@/lib/OSHConnectDataStructs';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, onMounted, ref, watch } from 'vue'

// TODO: Change datastream value to ID only, not the entire DS object

const props = defineProps<{
  property: string, // Property role to be used as key in vizwiz store
}>()

// Get datastreams from vizwiz store
const vizwizStore = useVizWizStore()
const listDatastreams = computed(() => {
  return vizwizStore.datastreams
})

// Update selected datastream for this role in vizwiz store
const selectedDatastream = computed({
  get: () => vizwizStore.dsConfig[props.property]?.ds,
  set: (val: OSHDatastream) => vizwizStore.updateDsConfig(props.property, { ds: val })
})

const selectedProperty = computed({
  get: () => vizwizStore.dsConfig[props.property]?.property,
  set: (val: SchemaFieldProperty[]) => vizwizStore.updateDsConfig(props.property, { property: val })
})


const chartDS = ref<any>(null)
const obsProps = ref<{ 'definition': string, 'label': string }[]>([])
const dsSchema = ref<any>(null)


// Fetch datasource observed properties
async function fetchProps() {
  const { ds, observedProps } = mineDatasourceObsPropsFromDS(selectedDatastream.value)
  chartDS.value = ds
  obsProps.value = observedProps

  const schema = await fetchSchema(ds.datastream)
  dsSchema.value = schema
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
    item-title="name" :item-value="(item: OSHDatastream) => item"></v-select>

  <!-- Select for property -->
  <v-select v-if="dsSchema && dsSchema.recordSchema" v-model="selectedProperty" :items="dsSchema.recordSchema.fields"
    label="Select property" item-title="name" persistent-hint :item-value="(item: any) => item.name"></v-select>
</template>

<style scoped></style>