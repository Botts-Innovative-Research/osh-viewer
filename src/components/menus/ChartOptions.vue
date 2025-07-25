<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils'
import { onMounted, ref, watch } from 'vue'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { useUIStore } from '@/stores/uistore'
import DataSourcePicker from '@/components/menus/DataSourcePicker.vue'
import TimePicker from '@/components/menus/TimePicker.vue'
import { useStartEndTimeSync, usePlaybackModeSync } from '@/composables/DataSourceOptions'
import { Mode } from 'osh-js/source/core/datasource/Mode.js'

const props = defineProps<{
  // onAddChart: () => void;
  // observedProperties: any[];
  // dsName: string;
}>()

const isOpen = ref<boolean>(false)
const visualizationStore = useVisualizationStore()
const chartDS = ref<any>(null)
const selectedProperty = ref<SchemaFieldProperty | null>(null)
const obsProps = ref<{ 'definition': string, 'label': string }[]>([])
const dsSchema = ref<any>(null)
const uiStore = useUIStore()

const emit = defineEmits(['update:selectedProperty'])

const startTime = ref<string | null>(null)
const endTime = ref<string | null>(null)
const playbackMode = ref(Mode.REPLAY)
const playbackModes = Object.entries(Mode).map(([key, value]) => ({
  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  value
}))

useStartEndTimeSync(startTime, endTime, visualizationStore)
usePlaybackModeSync(playbackMode, visualizationStore)

async function fetchProps() {
  const { ds, observedProps } = mineDatasourceObsProps()
  chartDS.value = ds
  obsProps.value = observedProps

  const schema = await fetchSchema(ds.datastream)
  dsSchema.value = schema
}

onMounted(async () => {
  fetchProps()
})

watch(selectedProperty, (val) => {
  emit('update:selectedProperty', val)
})
</script>

<template>
  <DataSourcePicker title="Chart Options" v-model:selectedProperty="selectedProperty"/>
  <TimePicker title="Start Time" v-model:formattedDate="startTime" />
  <TimePicker title="End Time" v-model:formattedDate="endTime" />
  <v-combobox
    v-model="playbackMode"
    :items="playbackModes"
    item-title="label"
    item-value="value"
    label="Playback Mode"
    variant="solo"
    density="compact"
  />
</template>

<style scoped>

</style>