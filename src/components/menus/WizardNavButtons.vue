<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
	step: number;
	steps: {title: string}[];
  selectedType: string;
}>();
const emit = defineEmits(['submitWizard', 'update:step']);

const internalStep = ref(props.step);

// const step = defineModel('step', {
// 	type: Number,
// 	default: 0,
// });
// const steps = ['LoB Options', 'Customization Options'];

function nextStep() {
	if (internalStep.value < props.steps.length - 1) {
		internalStep.value++;
	}
}

function prevStep() {
	if (internalStep.value > 0) {
		internalStep.value--;
	}
}

function submitWizard() {
	emit('submitWizard');
}

watch(internalStep, (newVal) => {
  emit('update:step', newVal);
});
</script>

<template>
	<v-row class="mt-6" justify="end">
		<v-btn v-if="internalStep > 0" variant="text" @click="prevStep" class="me-2">Back </v-btn>
		<v-btn
			v-if="internalStep < steps.length - 1"
			:disabled="step === 0 && !selectedType"
			color="primary"
			@click="nextStep"
			>Next
		</v-btn>
		<v-btn v-else-if="internalStep === steps.length - 1" color="primary" @click="submitWizard"
			>Submit
		</v-btn>
	</v-row>
</template>

<style scoped></style>
