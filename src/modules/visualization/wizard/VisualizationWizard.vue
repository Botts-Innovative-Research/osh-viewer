<script setup lang="ts">
import { onMounted } from 'vue';
import { VisualizationRegistry } from '../registry/VisualizationRegistry';
import { useVisualizationWizard } from './composables/useVisualizationWizard';

const {
	currentStep,
	componentValid,
	selectedType,
	completeSteps,
	stepStatus,
	isLastStep,
	changeStep,
	init,
	submit,
} = useVisualizationWizard({ mode: 'create' });

onMounted(async () => await init());
</script>

<template>
	<v-card class="pa-4">
		<v-card-title class="text-h4 text-center">Visualization Wizard</v-card-title>

		<v-stepper
			v-model="currentStep"
			class="wizard-content"
		>
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
						></v-stepper-item>
						<v-divider v-if="index < completeSteps.length - 1"></v-divider>
					</template>
				</v-stepper-header>

				<v-stepper-window>
					<!-- STEP CONTENT -->
					<v-stepper-window-item
						v-for="(step, index) in completeSteps"
						:key="step.id"
						:value="index + 1"
					>
						<h2 class="pb-2">{{ step.label }}</h2>
						<component
							:is="step.component"
							v-model:valid="componentValid[index]"
							v-bind="
								index === 1
									? { requireCs: VisualizationRegistry[selectedType]?.requireCs }
									: {}
							"
						/>
					</v-stepper-window-item>
				</v-stepper-window>
				<!-- NAVIGATION BUTTONS -->
				<v-stepper-actions>
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
	</v-card>
</template>

<style scoped>
.wizard-content {
	max-height: 80vh;
	overflow-y: auto;
	padding-right: 4px;
}
</style>
