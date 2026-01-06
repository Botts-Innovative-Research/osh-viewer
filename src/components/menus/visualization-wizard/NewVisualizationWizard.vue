<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent, onMounted } from 'vue';
import { useUIStore } from '@/stores/uistore';
import { useVizWizStore } from '@/stores/vizwizstore';
import SelectType from './SelectType.vue';
import SelectData from './SelectData.vue';
import { VisualizationType } from '@/types/types';

const uiStore = useUIStore();
const vizwizStore = useVizWizStore();
const selectedType = computed(() => {
	return vizwizStore.visualizationType;
});
const selectedTypeLabel = computed(() => {
	const type = vizwizStore.visualizationType;
	const vizType = visualizationTypes.find((vt) => vt.value === type);
	return vizType ? vizType.label : '';
});

// Clear store every time the wizard opens
onMounted(() => {
	vizwizStore.reset();
});

// Stepper Variables
const currentStep = ref(1)
const steps = [
	{ short: 'Type', title: 'Select Visualization Type' },
	{ short: 'Data', title: 'Select System & Datasource' },
	{ short: 'Configure', title: 'Configure Visualization Properties' },
	{ short: 'Customize', title: 'Customize Visualization' },
];
const stepStatus = (index: number) => {
  if (index < currentStep.value) return "primary"
  if (index = currentStep.value) return "primary"
  return ""
}
const isLastStep = computed(() => currentStep.value === steps.length)

// Visualization Types
const visualizationTypes: VisualizationType[] = [
  { label: 'Chart', value: 'chart', icon: 'mdi-chart-line' },
  { label: 'Video', value: 'video', icon: 'mdi-video' },
  { label: 'Point Marker', value: 'pmorientation', icon: 'mdi-map-marker' },
  { label: 'Text', value: 'text', icon: 'mdi-format-text' },
  { label: 'GeoPTZ', value: 'geoPtz', icon: 'mdi-map' },
	{ label: 'Line of Bearing', value: 'lob', icon: 'mdi-ray-start' },
]

const vizComponents: any = {
	pmorientation: {
		Config: defineAsyncComponent(
			() => import('@/components/menus/visualization-wizard/visualizations/pmorientation/Config.vue')
		),
		Customize: defineAsyncComponent(
			() => import('@/components/menus/visualization-wizard/visualizations/pmorientation/Customize.vue')
		),
		Builder: () => import('@/components/menus/visualization-wizard/visualizations/pmorientation/Builder'),
	},
	lob: {
		Config: defineAsyncComponent(
			() => import('@/components/menus/visualization-wizard/visualizations/lob/Config.vue')
		),
		Customize: defineAsyncComponent(
			() =>
				import('@/components/menus/visualization-wizard/visualizations/lob/Customize.vue')
		),
		Builder: () => import('@/components/menus/visualization-wizard/visualizations/lob/Builder'),
	},
  video: {
    Config: defineAsyncComponent(
        () => import('@/components/menus/visualization-wizard/visualizations/video/Config.vue')
    ),
    Customize: defineAsyncComponent(
        () => import('@/components/menus/visualization-wizard/visualizations/video/Customize.vue')
    ),
    Builder: () => import('@/components/menus/visualization-wizard/visualizations/video/Builder'),
  },
  geoPtz: {
    Config: defineAsyncComponent(
        () => import('@/components/menus/visualization-wizard/visualizations/geoptz/Config.vue')
    ),
    Customize: defineAsyncComponent(
        () => import('@/components/menus/visualization-wizard/visualizations/geoptz/Customize.vue')
    ),
    Builder: () => import('@/components/menus/visualization-wizard/visualizations/geoptz/Builder'),
  },
	chart: {
		Config: defineAsyncComponent(
			() => import('@/components/menus/visualization-wizard/visualizations/chart/Config.vue')
		),
		Customize: defineAsyncComponent(
			() =>
				import(
					'@/components/menus/visualization-wizard/visualizations/chart/Customize.vue'
				)
		),
		Builder: () => import('@/components/menus/visualization-wizard/visualizations/chart/Builder'),
	}
	// add other types here
};

const getStepComponent = (index: number) => {
	const type = selectedType.value ? selectedType.value : null;
	if (!type) return null;

	// Assign associated config and customize step components
	if (index === 2) return vizComponents[type]?.Config || null;
	if (index === 3) return vizComponents[type]?.Customize || null;
	return null;
};

const handleSubmit = async () => {
	const type = selectedType.value;
	const entry = vizComponents[type];

	if (!entry?.Builder) return;

	const builderModule = await entry.Builder();

	if (typeof builderModule.build !== 'function') {
		console.error(`Builder for ${type} missing build() export`);
		return;
	}

	// Call "build" function from the builder module
	builderModule.build();

  // Close the wizard
  uiStore.vizWizOpen = false
}

// Change step function
const changeStep = (direction: number) => {
  const newStep = currentStep.value + direction
  if (newStep < 1) return
  if (newStep > steps.length) {
    handleSubmit()
    return
  }
  currentStep.value = newStep
}

</script>

<template>
	<v-card class="pa-4 vwizard-card" elevation="4">
		<v-card-title class="text-h4 text-center">Visualization Wizard</v-card-title>

    <v-stepper v-model="currentStep" class="wizard-content">
      <template v-slot:default="{ }">
        <v-stepper-header>
          <template v-for="(step, index) in steps" :key="`${index}-step`">
            <v-stepper-item :complete="currentStep > index + 1" :step="index + 1" :value="index + 1" :title="step.short"
              :color="stepStatus(index)"></v-stepper-item>
            <v-divider v-if="index < steps.length - 1"></v-divider>
          </template>
        </v-stepper-header>

				<v-stepper-window>
					<v-stepper-window-item
						v-for="(step, index) in steps"
						:key="`${step.short}-content`"
						:value="index + 1"
					>
						<h2>{{ step.title + (currentStep != 1 ? ' - ' + selectedTypeLabel : '') }}</h2>
						<component
							v-if="index == 0"
							:is="SelectType"
							v-bind="{ visualizationTypes }"
						/>
						<component v-else-if="index == 1" :is="SelectData" />
						<component
							v-else-if="index === 2 || index === 3"
							:is="getStepComponent(index)"
						/>
						<v-sheet v-else class="pa-4 text-center">{{ step.title }}</v-sheet>
					</v-stepper-window-item>
				</v-stepper-window>

        <v-stepper-actions>
          <template #prev>
            <v-btn v-if="currentStep > 1" text @click="changeStep(-1)">
              Previous
            </v-btn>
            <v-spacer v-else></v-spacer>
          </template>

          <template #next>
            <v-btn :color="isLastStep ? 'success' : 'primary'" :disabled="false"
              @click="isLastStep ? handleSubmit() : changeStep(1)">
              {{ isLastStep ? 'Submit' : 'Next' }}
            </v-btn>
          </template>
        </v-stepper-actions>

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
