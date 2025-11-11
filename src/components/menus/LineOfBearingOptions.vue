<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils'
import { onMounted, ref, watch } from 'vue'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { useUIStore } from '@/stores/uistore'
import DataSourcePicker from '@/components/menus/DataSourcePicker.vue'
import TimePicker from '@/components/menus/TimePicker.vue'
import { useStartEndTimeSync, usePlaybackModeSync } from '@/composables/DataSourceOptions'
import { Mode } from 'osh-js/source/core/datasource/Mode.js'

const visualizationStore = useVisualizationStore()
// const markerDS = ref<any>(null)
const selectedProperty = ref<SchemaFieldProperty | null>(null)
const obsProps = ref<{ 'definition': string, 'label': string }[]>([])
const dsSchema = ref<any>(null)
const uiStore = useUIStore()

const color = defineModel('color', {
  type: String,
  default: 'Blue'
});

const weight = defineModel('weight', {
  type: Number,
  default: 10
});

const opacity = defineModel('opacity', {
  type: Number,
  default: 0.5
});

const distanceKm = defineModel('distanceKm', {
  type: Number,
  default: 1
});

const emit = defineEmits(['update:selectedProperty', 'update:color', 'update:opacity', 'update:distanceKm','update:weight' ])

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
  // markerDS.value = ds
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

watch(color, (val) => {
  console.log('[ColorOptions] Color changed:', val)
  emit('update:color', val)
})

watch(opacity, (val) => {
  console.log('[OpacityOptions] Opacity changed:', val)
  emit('update:opacity', val)
})

watch(distanceKm, (val) => {
  console.log('[DistanceKm Options] Distance Km changed:', val)
  emit('update:distanceKm', val)
})

watch(weight, (val) => {
  console.log('[WeightOptions] Weight changed:', val)
  emit('update:weight', val)
})

</script>

<template>
  <v-card>
    <DataSourcePicker title="LOB Options" v-model:selectedProperty="selectedProperty" />
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
    <v-card class="pa-4" elevation="2">
      <h3>Color</h3>
      <v-radio-group v-model="color">
        <v-radio :value="'#0000FF'" label="Blue" />
        <v-radio :value="'#FF0000'" label="Red" />
        <v-radio :value="'#ec18a7'" label="Pink" />
      </v-radio-group>
    </v-card>
    <v-card class="pa-4" elevation="2">
      <h3>Weight</h3>
      <input :value="10">
    </v-card>
    <v-card class="pa-4" elevation="2">
      <h3>Opacity</h3>
      <input :value="0.5">
    </v-card>
    <v-card class="pa-4" elevation="2">
      <h3>Distance (Km)</h3>
      <input :value="1">
    </v-card>
  </v-card>
</template>

<style scoped>

</style>