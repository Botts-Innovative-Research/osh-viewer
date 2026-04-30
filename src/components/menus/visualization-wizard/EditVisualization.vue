<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { useUIStore } from '@/stores/uistore';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, nextTick, onMounted, ref, toRaw } from 'vue';
import { VisualizationFormComponent, VisualizationRegistry } from './VisualizationRegistry';
import SelectData from './SelectData.vue';
import { showToast } from '@/composables/useToast';

const props = defineProps<{
  viz: OSHVisualization;
}>();

const isLoading = ref(true);
const uiStore = useUIStore();
const vizwizStore = useVizWizStore();
const visualizationStore = useVisualizationStore();
const selectedType = ref<string>('');
const initialConfig = ref();

// Clear store and restore wizard state to edit visualization
onMounted(async () => {
	// Reset vizwiz store
	vizwizStore.reset();

	// Setup initial config for comparison
	initialConfig.value = JSON.parse(JSON.stringify(props.viz.wizardConfig));
	vizwizStore.setWizardConfig(props.viz.wizardConfig);
	selectedType.value = props.viz.type;

	// Handle loading
	await nextTick();
	isLoading.value = false;
});

// Stepper
const currentStep = ref(1);
const completeSteps = computed(() => {
	const baseSteps: VisualizationFormComponent[] = [
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

// Submit edits
const handleSubmit = async () => {
	const type = selectedType.value;
	const entry = VisualizationRegistry[type];

	if (!entry) return;

	const builderModule = await entry.builder();

	const initial = JSON.stringify(toRaw(initialConfig.value));
	const updated = JSON.stringify(toRaw(vizwizStore.getWizardConfig()))

  // If changes were made, delete old viz to make new one
	if (initial !== updated) {
    visualizationStore.removeVisualization(props.viz) // Delete old visualization
    await nextTick(); // Let Vue unmount the viz component and disconnect datasources
    builderModule.default();  // Call default "build" function from the builder module
		showToast('Visualization updated', 'SUCCESS');
  } else {
    console.log("No changes were made. Skipping rebuild.")
		showToast('No changes made to visualization', 'INFO');
  }

	// Close the edit wizard
	uiStore.editVizOpen = false
}

// Change step function
const changeStep = (direction: number) => {
	const newStep = currentStep.value + direction
	if (newStep < 1) return
	if (newStep > completeSteps.value.length) return
	currentStep.value = newStep
}

// Validation for steps
const componentValid = ref<boolean[]>([])

</script>

<template>
	<v-card class="pa-4" v-if="!isLoading">
		<v-card-title class="text-h4 text-center">Edit Visualization</v-card-title>
		<v-card class="text-center" color="info">
			<v-card-title>{{ props.viz.name }}</v-card-title>
		</v-card>
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
						<h2 class="pb-2">{{ step.label }}</h2>
						<component :is="step.component" v-model:valid="componentValid[index]" v-bind="index === 1 ? { requireCs: VisualizationRegistry[selectedType]?.requireCs } : {}" />
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
						<v-btn :color="isLastStep ? 'success' : 'primary'" :disabled="!componentValid[currentStep - 1]"
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
.wizard-content {
	max-height: 80vh;
	overflow-y: auto;
	padding-right: 4px;
}
</style>