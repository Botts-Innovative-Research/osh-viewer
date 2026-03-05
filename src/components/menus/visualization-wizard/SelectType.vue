<script setup lang="ts">
import { useVizWizStore } from '@/stores/vizwizstore';
import { ref, computed } from 'vue';
import { VisualizationRegistry } from './VisualizationRegistry';


// Update visualizationType in vizwiz store
const vizwizStore = useVizWizStore();
const selectedType = computed({
	get: () => vizwizStore.visualizationType,
	set: (val: string) => vizwizStore.setType(val),
});

// Uses store setType to update value
function selectType(type: string) {
	vizwizStore.reset() // Reset store when selecting new type
	selectedType.value = type;
}
</script>
<template>
	<v-row justify="center" align="center" class="mb-2" v-if="VisualizationRegistry">
		<v-col v-for="type in Object.values(VisualizationRegistry)" :key="type.id" cols="12" sm="6" md="3"
			class="d-flex justify-center">
			<v-card :elevation="selectedType === type.id ? 10 : 2" :color="selectedType === type.id ? 'primary' : ''"
				class="d-flex flex-column align-center justify-center pa-4 type-card" @click="selectType(type.id)"
				style="cursor: pointer; min-height: 120px; max-width: 220px; width: 100%">
				<v-icon size="36" class="mb-2">{{ type.icon }}</v-icon>
				<span>{{ type.label }}</span>
			</v-card>
		</v-col>
	</v-row>
</template>
