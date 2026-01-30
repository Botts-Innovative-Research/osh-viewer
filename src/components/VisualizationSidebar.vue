<script setup lang="ts">
// @ts-ignore
import { useUIStore } from '@/stores/uistore.ts';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { storeToRefs } from 'pinia';
import VisualizationWrapper from './VisualizationWrapper.vue';

// Each visualization can be represented by an object with a unique id
// const visualizations = ref<VisualizationMetadata[]>([])
const visualizationStore = useVisualizationStore();
const { visualizations } = storeToRefs(visualizationStore);

</script>

<template>
	<v-card id="viz-sidebar">
		<v-card-title class="viz-title ma-1">
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
			<v-expansion-panels
				:model-value="visualizations.map(v => v.id)"
				multiple
				variant="accordion"
			>
				<v-expansion-panel
					v-for="viz in visualizations"
					:key="viz.id"
					class="visualization-item"
					:value="viz.id"
					static
				>
					<template #title>
						<div class="panel-header">
							<span>{{ viz.name }}</span>
							<v-btn
								aria-label="Remove"
								class="ml-2 mr-2"
								icon="mdi-close"
								size="x-small"
								variant="plain"
								@click.stop="visualizationStore.removeVisualization(viz)"
							></v-btn>
							
						</div>
					</template>
					<v-expansion-panel-text>
						<VisualizationWrapper :viz="viz">
							<template #overlay>
								
							</template>
						</VisualizationWrapper>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
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

.panel-header {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: space-between;
}
</style>
