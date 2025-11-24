<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent, onMounted } from 'vue'
import { useUIStore } from '@/stores/uistore'
import ChartOptions from '@/components/menus/ChartOptions.vue'
import { OSHVisualization } from '@/lib/OSHConnectDataStructs'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import { VisualizationComponents } from '@/lib/VisualizationHelpers'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { storeToRefs } from 'pinia'
import VideoOptions from '@/components/menus/VideoOptions.vue'
import GeoPTZOptions from '@/components/menus/GeoPTZOptions.vue'
import PointMarkerOptions from '@/components/menus/PointMarkerOptions.vue'
import { CreateChartViewProps, CreateMapViewProps, CreateVideoViewProps, CreateGeoPtzViewProps } from '@/lib/DatasourceUtils'
import IconPicker from '@/components/menus/IconPicker.vue'
import { useVizWizStore } from '@/stores/vizwizstore'
import SelectType from './SelectType.vue'
import SelectData from './SelectData.vue'
import { VisualizationType } from '@/types/types'

const vizwizStore = useVizWizStore()
const selectedType = computed(() => {
  return vizwizStore.visualizationType
})

// Clear store every time the wizard opens
onMounted(() => {
  vizwizStore.reset()
})

// Stepper Variables
const e1 = ref(1)
const steps = [
  { short: 'Type', title: 'Select Visualization Type' },
  { short: 'Data', title: 'Select System & Datasource' },
  { short: 'Configure', title: 'Configure Visualization Properties' },
  { short: 'Customize', title: 'Customize Visualization' }
]
const stepStatus = (index: number) => {
  if (index < e1.value) return "primary"
  if (index = e1.value) return "primary"
  return ""
}

// Return step to be disabled based on current step
const disabled = computed(() => {
  if (e1.value === 1) return 'prev'
  if (e1.value === steps.length) return 'next'
})

// Visualization Types
const visualizationTypes: VisualizationType[] = [
  { label: 'Chart', value: 'chart', icon: 'mdi-chart-line' },
  { label: 'Video', value: 'video', icon: 'mdi-video' },
  { label: 'Point Marker', value: 'pointmarker', icon: 'mdi-map-marker' },
  { label: 'Text', value: 'text', icon: 'mdi-format-text' },
  { label: 'GeoPTZ', value: 'geoPtz', icon: 'mdi-map' },
  { label: 'PM Orientation', value: 'pmorientation', icon: 'mdi-map-marker-left-outline' },
]
type VizTypeKeys = (typeof visualizationTypes)[number]['value']

const vizComponents: Record<VizTypeKeys, {Config: any, Customize: any}> = {
  pmorientation: {
    Config: defineAsyncComponent(() => import('@/components/menus/visualization-wizard/visualizations/pmorientation/Config.vue')),
    Customize: defineAsyncComponent(() => import('@/components/menus/visualization-wizard/visualizations/pmorientation/Customize.vue')),
  },
  // add other types here
}

const getStepComponent = (index: number) => {
  const type = selectedType.value ? selectedType.value : null
  if (!type) return null

  // Assign associated config and customize step components
  if (index === 2) return vizComponents[type]?.Config || null
  if (index === 3) return vizComponents[type]?.Customize || null
  return null
}

</script>

<template>
  <v-card class="pa-4 vwizard-card" elevation="4">

    <v-card-title class="text-h4 text-center">Visualization Wizard</v-card-title>

    <v-stepper v-model="e1" class="wizard-content">
      <template v-slot:default="{ prev, next }">
        <v-stepper-header>
          <template v-for="(step, index) in steps" :key="`${index}-step`">
            <v-stepper-item :complete="e1 > index + 1" :step="index + 1" :value="index + 1"
              :title="step.short" :color="stepStatus(index)"></v-stepper-item>
            <v-divider v-if="index < steps.length - 1"></v-divider>
          </template>
        </v-stepper-header>

        <v-stepper-window>
          <v-stepper-window-item v-for="(step, index) in steps" :key="`${step.short}-content`" :value="index + 1">
            <h2>{{ step.title }}</h2>
            <component v-if="index == 0" :is="SelectType" v-bind="{ visualizationTypes }" />
            <component v-else-if="index == 1" :is="SelectData" />
            <component v-else-if="(index === 2 || index === 3)" :is="getStepComponent(index)" />
            <v-sheet v-else class="pa-4 text-center">{{ step.title }}</v-sheet>
          </v-stepper-window-item>
        </v-stepper-window>

        <v-stepper-actions :disabled="disabled" @click:next="next" @click:prev="prev"></v-stepper-actions>
      </template>
    </v-stepper>

  </v-card>
</template>

<style scoped>
.vwizard-card {
  width: 75vw;
  max-width: 900px;
  min-width: 320px;
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  scroll-behavior: smooth;
}

.wizard-content {
  max-height: 900px;
  overflow-y: auto;
  padding-right: 4px;
}
</style>