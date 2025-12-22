<script setup lang="ts">
import { ref } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import Chart from '@/components/visualizations/Chart.vue';
import { useUIStore } from '@/stores/uistore.ts';
import {
	checkDSForProp,
	mineDatasourceObsProps,
	VisualizationMetadata,
} from '@/lib/DatasourceUtils';
import Video from '@/components/visualizations/Video.vue';
import AddChartModal from '@/components/AddChartModal.vue';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import VisualizationWizard from './menus/VisualizationWizard.vue';
import { storeToRefs } from 'pinia';
import VisualizationWrapper from './visualizations/VisualizationWrapper.vue';
import { on } from 'events';

// Each visualization can be represented by an object with a unique id
// const visualizations = ref<VisualizationMetadata[]>([])
const visualizationStore = useVisualizationStore();
const { visualizations } = storeToRefs(visualizationStore);
const dataSource = ref<any>(null);
const dsProps = ref<any[]>([]);
const wizardDialog = ref(false);
const uiStore = storeToRefs(useUIStore());
const visualizationWizardOpen = uiStore.visualizationWizardOpen;

/**
 *
 */
function addChart() {
	const { ds, observedProps } = mineDatasourceObsProps();
	dsProps.value = observedProps;
	const prop = checkDSForProp('air_temperature', observedProps);

	if (prop) {
		console.log('Air temperature property found:', prop);
		dataSource.value = ds;
		return;
	}
}

/**
 * Adds a video visualization to the list of visualizations.
 * It checks if the datasource has a 'RasterImage' property and adds it if found.
 */
function addVideo() {
	const { ds, observedProps } = mineDatasourceObsProps();
	dsProps.value = observedProps;
	const prop = checkDSForProp('RasterImage', observedProps);

	if (prop) {
		dataSource.value = ds;

		const newViz = new OSHVisualization(
			'video-' + randomUUID(),
			'video',
			'video',
			prop.definition,
			ds
		);

		console.log('[Viz-Sidebar] Adding new video visualization:', newViz);

		visualizationStore.addVisualization(newViz);
	}
}
</script>

<template>
  <v-card id="viz-sidebar">
    <v-card-title class="viz-title ma-4">Visualizations</v-card-title>
    <v-btn icon="mdi-plus" aria-label="Add" @click="useUIStore().openVizWiz()"></v-btn>
    <v-divider></v-divider>


		<!--    <AddChartModal :onAddChart="addChart" :observedProps="dsProps.values" :dsName="'test'"></AddChartModal>-->
		<!--    <v-btn @click="addVideo">Add Video</v-btn>-->
		<v-sheet class="visualization-list">
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
