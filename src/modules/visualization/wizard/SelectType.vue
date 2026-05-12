<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed } from 'vue';
import {
	VisualizationComponentEmits,
	VisualizationRegistry,
} from '../registry/VisualizationRegistry';
import RadioCards from '@/components/ui/RadioCards.vue';
import { useComponentValidation } from './composables/useComponentValidation';

// Update visualizationType in vizwiz store
const vizwizStore = useVizWizStore();
const selectedType = computed({
	get: () => vizwizStore.visualizationType,
	set: (val: string) => vizwizStore.setType(val),
});

// Sort visualization types by label
const visualizationTypes = computed(() => {
	return Object.values(VisualizationRegistry).sort((a, b) => a.label.localeCompare(b.label));
});

// Uses store setType to update value
function selectType(item: any) {
	vizwizStore.clear(); // Clear store when selecting new type, KEEP ID
	selectedType.value = item.id;
}

// Validation: a type must be selected
const emit = defineEmits<VisualizationComponentEmits>();
const valid = computed(() => {
	return !!selectedType.value;
});
useComponentValidation(valid, emit);
</script>
<template>
	<radio-cards
		:items="visualizationTypes"
		:selected-item="
			Object.values(VisualizationRegistry).find((item) => item.id === selectedType)
		"
		tooltip
		@update:value="selectType"
	></radio-cards>
</template>
