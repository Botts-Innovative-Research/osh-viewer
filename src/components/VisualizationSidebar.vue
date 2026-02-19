<script setup lang="ts">
// @ts-ignore
import { useUIStore } from '@/stores/uistore.ts';
import { MAP_VISUALIZATIONS, PANEL_VISUALIZATIONS, useVisualizationStore } from '@/stores/visualizationstore';
import { storeToRefs } from 'pinia';
import VisualizationWrapper from './VisualizationWrapper.vue';
import { computed, onMounted, ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ILineOfBearingLayerProperties, IPointMarkerLayerProperties, VisualizationLayerProperties } from '@/lib/VisualizationHelpers';
import GeoPTZ from './menus/visualization-wizard/visualizations/geoptz/GeoPTZ.vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';

// Each visualization can be represented by an object with a unique id
const visualizationStore = useVisualizationStore();
const { visualizations } = storeToRefs(visualizationStore);
const mapPanelOpen = ref(true);

// Separate visualizations into panel and map types
const panelVisualizations = computed<OSHVisualization[]>(() => visualizations.value.filter(viz =>
	PANEL_VISUALIZATIONS.includes(viz.type)
));
const mapVisualizations = computed<OSHVisualization[]>(() => visualizations.value.filter(viz =>
	MAP_VISUALIZATIONS.includes(viz.type)
));

// Check that type is a map layer
function isMapLayer(
  layer: VisualizationLayerProperties | null
): layer is IPointMarkerLayerProperties | ILineOfBearingLayerProperties {
  return !!layer && 'iconName' in layer;
}
const geoPtzVisualizations = computed(() => visualizations.value.filter(viz =>
	viz.type === 'geoPtz'
))
const selectedGeoPtzControllers = ref(geoPtzVisualizations ? geoPtzVisualizations.value[0] : {})

const toggleSelectedMapItem = (item: any) => {
	const uiStore = useUIStore();
	if (uiStore.selectedMapItem && uiStore.selectedMapItem.id === item.id) {
		uiStore.setSelectedMapItem(null);
	} else {
		uiStore.setSelectedMapItem(item);
	}
};

onMounted(() => {
	if (mapVisualizations.value.length > 0) {
		mapPanelOpen.value = true;
	}
});

</script>

<template>
	<v-card id="viz-sidebar">
		<v-card-title class="viz-title ma-1">
			<span class="viz-title mr-4">Visualizations</span>
			<v-tooltip text="Add Visualization" location="bottom">
				<template v-slot:activator="{ props }">
					<v-btn v-bind="props" icon="mdi-plus" aria-label="Add Visualization" @click="useUIStore().openVizWiz()"
						size="small"></v-btn>
				</template>
			</v-tooltip>
		</v-card-title>
		<v-divider></v-divider>

		<v-sheet class="visualization-list overflow-y-auto">
			<!-- MAP VISUALIZATIONS -->
			<v-expansion-panels multiple eager>
				<v-expansion-panel :disabled="mapVisualizations.length == 0" :value="mapVisualizations.length > 0" static>
					<template #title>
						<div class="panel-header">
							Map Visualizations
						</div>
					</template>
					<v-expansion-panel-text>
						<v-list activatable density="compact" select-strategy="leaf">
							<v-list-item v-for="viz in mapVisualizations" :key="viz.id" @click="toggleSelectedMapItem(viz)">
								<template #prepend>
									<v-icon :icon="`mdi-${isMapLayer(viz.visualizationComponents.dataLayer) ? viz.visualizationComponents.dataLayer.iconName : ''}`" size="16"></v-icon>
								</template>
								<template #title>{{ viz.name }}</template>
								<template #append>
									<v-btn aria-label="Remove" class="close-btn" icon="mdi-window-close" size="x-small" variant="plain"
										@click.stop="visualizationStore.removeVisualization(viz)"></v-btn>
								</template>
							</v-list-item>
						</v-list>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
			<!-- GEOPTZ VISUALIZATIONS -->
			<v-expansion-panels multiple eager>
				<v-expansion-panel :disabled="geoPtzVisualizations.length == 0" static>
					<template #title>
						<div class="panel-header">
							GeoPTZ Controllers
						</div>
					</template>
					<v-expansion-panel-text>
						<v-sheet :style="{display: 'flex'}">
							<v-select
								label="Process"
								v-model="selectedGeoPtzControllers"
								:model-value="geoPtzVisualizations[0]"
								:items="geoPtzVisualizations"
								item-title="name"
								:item-value="(item: OSHVisualization) => item"
								chips
								
							></v-select>
							<v-divider vertical></v-divider>
							<p>{{ selectedGeoPtzControllers?.name }}</p>
							<!-- <GeoPTZ
								:visualization="selectedGeoPtzControllers"
								:datasource="Array.isArray(selectedGeoPtzControllers.visualizationComponents.dataSource) ? selectedGeoPtzControllers[0].visualizationComponents.dataSource[0] : selectedGeoPtzControllers.visualizationComponents.dataSource"
								:controlstream="selectedGeoPtzControllers.visualizationComponents.controlstream"
							></GeoPTZ> -->
						</v-sheet>
						<!-- <v-list activatable density="compact" select-strategy="leaf">
							<v-list-item v-for="viz in geoPtzVisualizations" :key="viz.id" @click="">
								<template #prepend>
									<v-icon :icon="`mdi-arrow`" size="16"></v-icon>
								</template>
								<template #title>{{ viz.name }}</template>
								<template #append>
									<v-btn aria-label="Remove" class="close-btn" icon="mdi-window-close" size="x-small" variant="plain"
										@click.stop="visualizationStore.removeVisualization(viz)"></v-btn>
								</template>
							</v-list-item>
						</v-list> -->
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
			<!-- PANEL VISUALIZATIONS -->
			<v-expansion-panels :model-value="panelVisualizations.map(v => v.id)" variant="accordion" multiple eager>
				<v-expansion-panel v-for="viz in panelVisualizations" :key="viz.id" class="visualization-item" :value="viz.id"
					static>
					<template #title>
						<div class="panel-header">
							<span>{{ viz.name }}</span>
							<v-btn aria-label="Remove" class="ml-2 mr-2 close-btn" icon="mdi-close" size="x-small" variant="plain"
								@click.stop="visualizationStore.removeVisualization(viz)"></v-btn>
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

/* Color styling for delete button */
.close-btn {
	transition: color 0.2s ease-in-out;
}

.close-btn:hover {
	color: red;
}

.close-btn:active {
	color: red;
}
</style>
