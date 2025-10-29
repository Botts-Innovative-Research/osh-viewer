<script setup lang="ts">
import { fetchSchema, mineDatasourceObsProps, SchemaFieldProperty } from '@/lib/DatasourceUtils'
import { fetchControlStreamSchema } from '@/lib/ControlstreamUtils'
import { onMounted, ref, watch } from 'vue'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { useUIStore } from '@/stores/uistore'
import { useControlStreamStore } from '@/stores/controlstreamstore'
import DataSourcePicker from '@/components/menus/DataSourcePicker.vue'
import TimePicker from '@/components/menus/TimePicker.vue'
import { useStartEndTimeSync, usePlaybackModeSync } from '@/composables/DataSourceOptions'
import { Mode } from 'osh-js/source/core/datasource/Mode.js'
import { OSHControlStream } from '@/lib/OSHConnectDataStructs'
import { computed, PropType } from 'vue'


const visualizationStore = useVisualizationStore()
const videoDS = ref<any>(null)
const selectedProperty = defineModel('selectedProperty', {
  type: SchemaFieldProperty,
  default: null
})

// Control Stream Options
const selectedControlStream = defineModel('selectedControlStream', {
  type: Object as PropType<OSHControlStream>,
  default: null
})
const controlStreams = computed(() => {
  const uiStore = useUIStore()
  return uiStore.selectedDatastream?.getParentSystem().getCSChildren() || []
})
const csSchemas = ref<{ [key: string]: any }>({})

const videoType = defineModel('videoType', {
  type: String,
  default: 'H264'
})
const obsProps = ref<{ 'definition': string, 'label': string }[]>([])
const dsSchema = ref<any>(null)
const startTime = ref<string | null>(null)
const endTime = ref<string | null>(null)
const emit = defineEmits(['update:selectedProperty', 'update:videoType'])
// Time Mode Options
const playbackMode = ref(Mode.REAL_TIME)
const playbackModes = Object.entries(Mode).map(([key, value]) => ({
  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  value
}))

async function fetchProps() {
  const { ds, observedProps } = mineDatasourceObsProps()
  videoDS.value = ds
  obsProps.value = observedProps

  const schema = await fetchSchema(ds.datastream)
  dsSchema.value = schema

  // Fetch control stream schemas
  for (const cs of controlStreams.value) {
    const csSchema = await fetchControlStreamSchema(cs, ds.datastream.networkProperties)
    csSchemas.value[cs.id] = csSchema
  }
}

onMounted(async () => {
  fetchProps()
})

watch(selectedProperty, (val) => {
  emit('update:selectedProperty', val)
})

watch(videoType, (val) => {
  console.log('[VideoOptions] Video type changed:', val)
  emit('update:videoType', val)
})

// Use the composable to sync start and end time with the visualization store
useStartEndTimeSync(startTime, endTime, visualizationStore)
usePlaybackModeSync(playbackMode, visualizationStore)

</script>

<template>
  <v-card>
    <DataSourcePicker title="Video Options" v-model:selectedProperty="selectedProperty" />
    <TimePicker title="Start Time" v-model:formattedDate="startTime" />
    <TimePicker title="End Time" v-model:formattedDate="endTime" />
    <v-combobox v-model="playbackMode" :items="playbackModes" item-title="label" item-value="value"
      label="Playback Mode" variant="solo" density="compact" />

    <v-card class="pa-4" elevation="2">
      <h3>Video Type</h3>
      <v-radio-group v-model="videoType">
        <v-radio :value="'H264'" label="H264" />
        <v-radio :value="'MJPEG'" label="MJPEG" />
      </v-radio-group>
    </v-card>

    <v-card class="pa-4" elevation="2">
      <h3>Control Streams</h3>
      <v-radio-group v-model="selectedControlStream">
        <v-radio v-for="cs in controlStreams" :key="cs.id" :value="cs" :label="cs.name">
          <template #label>
            <div>
              <p>{{ cs.name || 'Unnamed Stream' }}</p>
              <div class="text-caption text-grey">
                {{ cs.description || 'No description' }}
              </div>
              <div v-if="csSchemas[cs.id]" class="mt-1 text-body-2">
                <pre style="overflow:auto;">
            {{ JSON.stringify(csSchemas[cs.id], null, 2) }}
          </pre>
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>
    </v-card>

  </v-card>
</template>

<style scoped></style>