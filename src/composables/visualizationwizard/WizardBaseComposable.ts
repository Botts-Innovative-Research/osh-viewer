import { ref } from 'vue';

export function visualizationOptionsCreate() {
	// const visualizationOptions: VisualizationOptions;
	// return visualizationOptions;
}

export function useNumSteps(numSteps) {
	const numStepsRef = ref(numSteps);

	return numStepsRef.value;
}

export function useStep(stepVal) {
	const step = ref(stepVal);

	return step.value;
}

export function nextStep() {
	const step = useStep();

	if (step.value < steps.length - 1) {
		step.value++;
	} else {
		submitWizard();
	}
}

export function prevStep() {
	const step = useStep();
	if (step.value > 0) {
		step.value--;
	}
}
