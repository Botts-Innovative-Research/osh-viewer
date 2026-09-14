<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { computed, ref, watch } from 'vue';
import {
	VisualizationComponentEmits,
	VisualizationRegistry,
} from '../registry/VisualizationRegistry';
import RadioCards from '@/components/ui/RadioCards.vue';
import { useComponentValidation } from './composables/useComponentValidation';
import { VisualizationDescriptor } from '../registry/types';
import { OSHLayerLabels } from '@/lib/OSHConnectDataStructs';

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

// Filtering
const selectedFilters = ref<VisualizationDescriptor[]>([]);
const filteredTypes = computed(() => {
	// No filters selected -> show all
	if (!selectedFilters.value.length) {
		return visualizationTypes.value;
	}

	return visualizationTypes.value.filter((item: VisualizationDescriptor) =>
		item.layers.some((layer) => selectedFilters.value.includes(layer))
	);
});

watch(selectedFilters, () => {
	// If the currently selected type is not in the filtered list, clear the selection
	if (
		selectedType.value &&
		!filteredTypes.value.some((item: VisualizationDescriptor) => item.id === selectedType.value)
	) {
		selectedType.value = '';
	}
});

// Validation: a type must be selected
const emit = defineEmits<VisualizationComponentEmits>();
const valid = computed(() => {
	return !!selectedType.value;
});
useComponentValidation(valid, emit);
</script>
<template>
	<v-sheet>
		<v-row>
			<h4 class="ma-0">Filter by layer</h4>
		</v-row>
		<v-row class="align-center ma-0 ga-2">
			<v-chip
				v-if="selectedFilters.length"
				closable
				elevated
				@click="selectedFilters = []"
				@click:close="selectedFilters = []"
			>
				Clear All
			</v-chip>
			<v-chip-group
				filter
				multiple
				v-model="selectedFilters"
			>
				<v-chip
					v-for="type in OSHLayerLabels"
					:key="type.layer"
					:value="type.layer"
				>
					{{ type.label }}
				</v-chip>
			</v-chip-group>
		</v-row>
		<v-row class="ma-0">
			<v-expand-transition>
				<div
					class="w-100 mt-4"
					:key="selectedFilters.join(',')"
				>
					<radio-cards
						:items="filteredTypes"
						:selected-item="
							Object.values(VisualizationRegistry).find(
								(item: VisualizationDescriptor) => item.id === selectedType
							)
						"
						tooltip
						@update:value="selectType"
						size="large"
					></radio-cards>
				</div>
			</v-expand-transition>
		</v-row>
	</v-sheet>
</template>
<style scoped></style>
