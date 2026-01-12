<script setup lang="ts">
import { ref } from 'vue';
// @ts-ignore
import { useUIStore } from '@/stores/uistore.ts';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { storeToRefs } from 'pinia';
import VisualizationWrapper from './VisualizationWrapper.vue';

// Each visualization can be represented by an object with a unique id
// const visualizations = ref<VisualizationMetadata[]>([])
const visualizationStore = useVisualizationStore();
const { visualizations } = storeToRefs(visualizationStore);
const dataSource = ref<any>(null);
const dsProps = ref<any[]>([]);
const wizardDialog = ref(false);
const uiStore = storeToRefs(useUIStore());
const visualizationWizardOpen = uiStore.visualizationWizardOpen;
</script>

<template>
	<v-card id="viz-sidebar">
		<v-card-title class="viz-title ma-2">
      <span class="viz-title mr-4">Visualizations</span>
      <v-tooltip text="Add Visualization" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
              v-bind="props"
              icon="mdi-plus"
              aria-label="Add Visualization"
              @click="useUIStore().openVizWiz()"
              size="small"
          ></v-btn>
        </template>
      </v-tooltip>
    </v-card-title>
		<v-divider></v-divider>

		<v-sheet class="visualization-list overflow-y-auto">
			<div v-for="viz in visualizations" :key="viz.id" class="visualization-item">
				<VisualizationWrapper :viz="viz">
					<template #overlay>
						<v-btn
							aria-label="Remove"
							class="ma-2"
							icon="mdi-close"
							size="x-small"
							@click="visualizationStore.removeVisualization(viz)"
							style="position: absolute; top: 8px; right: 8px; z-index: 10"
						></v-btn>
					</template>
				</VisualizationWrapper>
			</div>
		</v-sheet>
	</v-card>
</template>

<style scoped>
#viz-sidebar {
	width: 100%;
	height: 100%;
}

.viz-title {
	text-align: center;
	width: 100%;
	font-size: 1.5rem;
	font-weight: bold;
}

.visualization-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	overflow-y: scroll;
	max-height: 90vh;
}
</style>
