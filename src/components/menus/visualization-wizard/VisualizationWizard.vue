<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useUIStore } from '@/stores/uistore';
import { useVizWizStore } from '@/stores/vizwizstore';
import SelectType from './SelectType.vue';
import SelectData from './SelectData.vue';
import { VisualizationFormComponent, VisualizationRegistry } from './VisualizationRegistry';

const uiStore = useUIStore();
const vizwizStore = useVizWizStore();
const selectedType = computed(() => {
	return vizwizStore.visualizationType;
});

// Clear store every time the wizard opens
onMounted(() => {
	vizwizStore.reset();
});

// Stepper Variables
const currentStep = ref(1)
const completeSteps = computed(() => {
	const baseSteps: VisualizationFormComponent[] = [
		{ id: 'select-type', label: 'Select Visualization Type', short: 'Type', component: SelectType },
		{ id: 'select-data', label: `Select System & Datasource - ${VisualizationRegistry[selectedType.value]?.label || 'Unknown'}`, short: 'Data', component: SelectData },
	]

	if (!selectedType.value) {
		const placeholderStep: VisualizationFormComponent = {
			id: 'placeholder',
			label: 'Next steps',
			short: '...',
			component: null,
		}
		return [...baseSteps, placeholderStep]
	}
	else {
		const entry = VisualizationRegistry[selectedType.value]
		const dynamicSteps: VisualizationFormComponent[] = entry.formComponents.map(comp => comp) ?? []
		return [...baseSteps, ...dynamicSteps]
	}
})
const stepStatus = (index: number) => {
	if (index < currentStep.value) return "primary"
	if (index === currentStep.value) return "primary"
	return ""
}
const isLastStep = computed(() => currentStep.value === completeSteps.value.length)

const handleSubmit = async () => {
	const type = selectedType.value;
	const entry = VisualizationRegistry[type];

	if (!entry) return;

	const builderModule = await entry.builder();

	// Call default "build" function from the builder module
	builderModule.default();

	// Close the wizard
	uiStore.vizWizOpen = false
}

// Change step function
const changeStep = (direction: number) => {
	const newStep = currentStep.value + direction
	if (newStep < 1) return
	if (newStep > completeSteps.value.length) return
	currentStep.value = newStep
}

</script>

<template>
	<v-card class="pa-4 vwizard-card" elevation="4">
		<v-card-title class="text-h4 text-center">Visualization Wizard</v-card-title>

		<v-stepper v-model="currentStep" class="wizard-content">
			<template v-slot:default="{ }">
				<v-stepper-header>
					<template v-for="(step, index) in completeSteps" :key="step.id">
						<v-stepper-item
							:complete="currentStep > index + 1"
							:step="index + 1" 
							:value="index + 1" 
							:title="step.short"
							:color="stepStatus(index)"
						></v-stepper-item>
						<v-divider v-if="index < completeSteps.length - 1"></v-divider>
					</template>
				</v-stepper-header>

				<v-stepper-window>
					<!-- STEP CONTENT -->
					<v-stepper-window-item v-for="(step, index) in completeSteps" :key="step.id" :value="index + 1">
						<h2 class="pa-2">{{ step.label }}</h2>
						<component :is="step.component" />
					</v-stepper-window-item>
				</v-stepper-window>
				<!-- NAVIGATION BUTTONS -->
				<v-stepper-actions>
					<template #prev>
						<v-btn v-if="currentStep > 1" text @click="changeStep(-1)">
							Previous
						</v-btn>
						<v-spacer v-else></v-spacer>
					</template>

					<template #next>
						<v-btn :color="isLastStep ? 'success' : 'primary'" :disabled="!selectedType"
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
	max-width: 100%;
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
