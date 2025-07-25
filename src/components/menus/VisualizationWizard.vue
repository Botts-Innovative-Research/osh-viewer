<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUIStore } from '@/stores/uistore'
import ChartOptions from '@/components/menus/ChartOptions.vue'
import { OSHVisualization } from '@/lib/OSHConnectDataStructs'
import { randomUUID } from 'osh-js/source/core/utils/Utils.js'
import { VisualizationComponents } from '@/lib/VisualizationHelpers'
import { useVisualizationStore } from '@/stores/visualizationstore'
import { storeToRefs } from 'pinia'
import VideoOptions from '@/components/menus/VideoOptions.vue'
import PointMarkerOptions from '@/components/menus/PointMarkerOptions.vue'
import { CreateChartViewProps, CreateMapViewProps, CreateVideoViewProps } from '@/lib/DatasourceUtils'
import IconPicker from '@/components/menus/IconPicker.vue'

const uiStore = useUIStore();
const { selectedDatastream } = storeToRefs(uiStore);

const vizStore = useVisualizationStore();
const step = ref(0)
const selectedType = ref('')
const selectedDSProperty = ref(null)
const selectedVisualizationOptions = ref(null)
const selectedMarkerProperty = ref(null)

const visualizationName = ref('')
const visualizationComponents = ref<VisualizationComponents | undefined>(undefined)
const visualizationSweApi = ref(null)

const steps = [
  { title: 'Choose Type' },
  { title: 'Datasource Options' },
  { title: 'Visualization Customization' }
]

const visualizationTypes = [
  { label: 'Chart', value: 'chart', icon: 'mdi-chart-line' },
  { label: 'Video', value: 'video', icon: 'mdi-video' },
  { label: 'Point Marker', value: 'pointmarker', icon: 'mdi-map' },
  { label: 'Text', value: 'text', icon: 'mdi-format-text' }
]

function selectType(type: string) {
  selectedType.value = type
}

function nextStep() {
  if (step.value < steps.length - 1) {
    step.value++
  } else {
    submitWizard()
  }
}

function prevStep() {
  if (step.value > 0) {
    step.value--
  }
}

function submitWizard() {
  const vizResult = createVisualization();

  if (!vizResult || !vizResult.components) {
    alert('Error creating visualization!');
  } else {
    visualizationComponents.value = vizResult.components;
    const newViz: OSHVisualization = vizResult.visualization;
    newViz.setVisualizationComponents(visualizationComponents.value);
    vizStore.addVisualization(newViz);
  }
  // TODO: Implement submit logic
  // For now, just close or reset
  uiStore.visualizationWizardOpen = false;
}

function createVisualization() {

  const newViz = new OSHVisualization(`visualization-${randomUUID()}`, visualizationName.value,
    selectedType.value, null, selectedDatastream.value);

  let visualizationComponents: VisualizationComponents | undefined = undefined;
  switch (newViz.type) {
    case 'chart':
      const chartResult = CreateChartViewProps(selectedDatastream.value, selectedDSProperty.value, vizStore.currentVisDataStreamOptions)
      visualizationComponents = {
        dataSource: chartResult.dataSource,
        dataLayer: chartResult.chartLayer,
        dataView: chartResult.chartView
      }
      break;
    case 'video':
      // Add video-specific properties if needed
      const videoResult = CreateVideoViewProps(selectedDatastream.value, selectedDSProperty.value,
        selectedVisualizationOptions.value, vizStore.currentVisDataStreamOptions);
      visualizationComponents = {
        dataSource: videoResult.dataSource,
        dataLayer: videoResult.videoLayer,
        dataView: videoResult.videoView
      }
      break;
    case 'pointmarker':
      const pmResult = CreateMapViewProps(selectedDatastream.value, selectedMarkerProperty.value,
        vizStore.currentVisDataStreamOptions)
      visualizationComponents = {
        dataSource: pmResult.dataSource,
        dataLayer: pmResult.mapLayer,
        dataView: pmResult.mapView
      }
      break;
    case 'text':
      // Add text-specific properties if needed
      break;
    default:
      console.warn('Unknown visualization type:', newViz.type);
  }

  console.log('[VizWiz] Creating new visualization:', newViz, visualizationComponents);

  return {
    visualization: newViz,
    components: visualizationComponents
  };
}

// Log selectedVisualizationOptions as it changes
watch(selectedVisualizationOptions, (val) => {
  console.log('[VizWiz] selectedVisualizationOptions changed:', val)
})
</script>

<template>
  <v-card class="pa-4 vwizard-card" elevation="4">
    <v-card-title class="text-h4 text-center">Visualization Wizard</v-card-title>
    <div v-if="selectedDatastream">
      <v-alert type="info" class="mb-2" density="compact" border="start" border-color="primary">
        <strong>Datastream:</strong> {{ selectedDatastream.name || selectedDatastream.id || selectedDatastream }}
      </v-alert>
    </div>
    <v-breadcrumbs :items="steps.map((s, i) => ({
        title: s.title,
        disabled: i > step,
        class: i < step ? 'text-primary font-weight-bold' : ''
      }))" class="mb-6">
      <template v-slot:divider>
        <v-icon icon="mdi-chevron-right"></v-icon>
      </template>
    </v-breadcrumbs>

    <div v-if="step === 0">
      <h2 class="mb-4 text-center">Choose Visualization Type</h2>
      <v-row justify="center" align="center" class="mb-2">
        <v-col
          v-for="type in visualizationTypes"
          :key="type.value"
          cols="12" sm="6" md="3"
          class="d-flex justify-center"
        >
          <v-card
            :elevation="selectedType === type.value ? 10 : 2"
            :color="selectedType === type.value ? 'primary' : ''"
            class="d-flex flex-column align-center justify-center pa-4 type-card"
            @click="selectType(type.value)"
            style="cursor:pointer; min-height:120px; max-width:220px; width:100%;"
          >
            <v-icon size="36" class="mb-2">{{ type.icon }}</v-icon>
            <span>{{ type.label }}</span>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div v-else-if="step === 1">
      <h2 class="mb-4 text-center">Datasource Options</h2>
      <div v-if="selectedType === 'chart'">
        <ChartOptions v-model:selectedProperty="selectedDSProperty"/>
      </div>
      <div v-else-if="selectedType === 'video'">
        <VideoOptions v-model:selectedProperty="selectedDSProperty"
                      v-model:videoType="selectedVisualizationOptions" />
      </div>
      <div v-else-if="selectedType === 'pointmarker'">
        <PointMarkerOptions v-model:selectedProperty="selectedMarkerProperty" />
      </div>
      <div v-else-if="selectedType === 'text'">
        <v-alert type="info">Text options coming soon...</v-alert>
      </div>
      <div v-else>
        <v-alert type="warning">Please select a visualization type.</v-alert>
      </div>
    </div>
    <div v-else-if="step === 2">
      <h2 class="mb-4 text-center">Visualization Customization</h2>
      <IconPicker></IconPicker>
    </div>

    <v-row class="mt-6" justify="end">
      <v-btn
        v-if="step > 0"
        variant="text"
        @click="prevStep"
        class="me-2"
      >Back
      </v-btn>
      <v-btn
        v-if="step < steps.length - 1"
        :disabled="step === 0 && !selectedType"
        color="primary"
        @click="nextStep"
      >Next
      </v-btn>
      <v-btn
        v-else-if="step === steps.length - 1"
        color="primary"
        @click="submitWizard"
      >Submit
      </v-btn>
    </v-row>
  </v-card>
</template>

<style scoped>
.vwizard-outer {
  width: 100vw;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.95);
}

.vwizard-card {
  width: 75vw;
  max-width: 900px;
  min-width: 320px;
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.type-card {
  transition: box-shadow 0.2s, background 0.2s;
  text-align: center;
}

.type-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}
</style>