<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { VisualizationRegistry } from '../registry/VisualizationRegistry';
import { useVisualizationWizard } from './composables/useVisualizationWizard';
import { onMounted } from 'vue';
import { VisualizationFormComponent } from '../registry/types';

const props = defineProps<{
	mode: 'create' | 'edit';
	viz: OSHVisualization | undefined;
}>();

const {
	init,
	isLoading,
	currentStep,
	componentValid,
	selectedType,
	completeSteps,
	stepStatus,
	isLastStep,
	changeStep,
	submit,
} = useVisualizationWizard({ mode: props.mode, viz: props.viz });

function handleStepBinds(
	stepIndex: number,
	selectedType: string,
	step: VisualizationFormComponent
) {
	// Handle data step
	if (stepIndex === 0) {
		return {
			supportsCs: VisualizationRegistry[selectedType]?.supportsCs,
			requireCs: VisualizationRegistry[selectedType]?.requireCs,
		};
	}
	// Pass roles as props
	else if (step?.roles) {
		return { configRoles: step.roles, optional: step.optional };
	}
	// Pass optional
	else if (step?.optional) {
		return { optional: step.optional };
	} else return;
}

onMounted(async () => await init());
</script>

<template>
	<v-card v-if="!isLoading">
		<v-card-item>
			<v-card-title class="text-display-small text-center">{{
				props.mode === 'create' ? 'Visualization Wizard' : 'Edit Visualization'
			}}</v-card-title>
		</v-card-item>
		<v-card-text class="pa-0">
			<v-alert
				v-if="props.mode === 'edit' && props.viz"
				:text="props.viz.name"
				color="primary"
				class="text-center"
			>
			</v-alert>
			<v-stepper v-model="currentStep">
				<template v-slot:default="{}">
					<v-stepper-header>
						<template
							v-for="(step, index) in completeSteps"
							:key="step.id"
						>
							<v-stepper-item
								:complete="currentStep > index + 1"
								:step="index + 1"
								:value="index + 1"
								:title="step.short"
								:color="stepStatus(index)"
								:subtitle="step.optional ? 'Optional' : ''"
							></v-stepper-item>
							<v-divider v-if="index < completeSteps.length - 1"></v-divider>
						</template>
					</v-stepper-header>

					<v-stepper-window class="wizard-content">
						<!-- STEP CONTENT -->
						<v-stepper-window-item
							v-for="(step, index) in completeSteps"
							:key="step.id"
							:value="index + 1"
						>
							<h1 class="ma-0 mb-4">{{ step.label }}</h1>
							<component
								:is="step.component"
								v-model:valid="componentValid[index]"
								v-bind="
									handleStepBinds(
										props.mode === 'create' ? index - 1 : index,
										selectedType,
										step
									)
								"
							/>
						</v-stepper-window-item>
					</v-stepper-window>
					<!-- NAVIGATION BUTTONS -->
					<v-stepper-actions class="step-actions">
						<template #prev>
							<v-btn
								v-if="currentStep > 1"
								text
								@click="changeStep(-1)"
							>
								Previous
							</v-btn>
							<v-spacer v-else></v-spacer>
						</template>

						<template #next>
							<v-btn
								:color="isLastStep ? 'success' : 'primary'"
								:disabled="!componentValid[currentStep - 1]"
								@click="isLastStep ? submit() : changeStep(1)"
							>
								{{ isLastStep ? 'Submit' : 'Next' }}
							</v-btn>
						</template>
					</v-stepper-actions>
				</template>
			</v-stepper>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.wizard-content {
	max-height: 60vh;
	overflow-y: auto;
}

.step-actions {
	position: sticky;
	bottom: 0;
	z-index: 10;
}
</style>
