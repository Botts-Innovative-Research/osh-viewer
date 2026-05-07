<script setup lang="ts">
// @ts-ignore
import { useUIStore } from '@/stores/uistore.ts';
import { useVisualizationStore } from '@/stores/visualizationstore';
import { storeToRefs } from 'pinia';
import VisualizationWrapper from './VisualizationWrapper.vue';
import { computed, onMounted, ref } from 'vue';
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ILineOfBearingLayerProperties, IPointMarkerLayerProperties, VisualizationLayerProperties } from '@/lib/VisualizationHelpers';
import GeoPTZ from './menus/visualization-wizard/visualizations/geoptz/GeoPTZ.vue';
import VisualizationWizard from './menus/visualization-wizard/VisualizationWizard.vue';
import DeleteButton from './ui/DeleteButton.vue';
import EditVisualization from './menus/visualization-wizard/EditVisualization.vue';
import Audio from './menus/visualization-wizard/visualizations/audio/Audio.vue';

// Each visualization can be represented by an object with a unique id
const visualizationStore = useVisualizationStore();
const { visualizations } = storeToRefs(visualizationStore);
const uiStore = useUIStore();

// Separate visualizations into panel and map types
const panelVisualizations = computed<OSHVisualization[]>(() => visualizations.value.filter(viz =>
	viz.viewLocation === 'panel'
));
const mapVisualizations = computed<OSHVisualization[]>(() => visualizations.value.filter(viz =>
	viz.viewLocation === 'map'
));
const geoPtzVisualizations = computed<OSHVisualization[]>(() => visualizations.value.filter(viz =>
	viz.type === 'geoPtz'
))

// GeoPTZ Helpers
const selectedGeoPtzControllers = ref<OSHVisualization[]>([])
const removeGeoPTZ = (controller: OSHVisualization) => {
	visualizationStore.removeVisualization(controller);	// Remove from visualization store
	selectedGeoPtzControllers.value = selectedGeoPtzControllers.value.filter((item: OSHVisualization) => item.id !== controller.id)	// Remove from selected list
}



// Check that type is a map layer
const isMapLayer = (
	layer: VisualizationLayerProperties | null
): layer is IPointMarkerLayerProperties | ILineOfBearingLayerProperties => {
	return !!layer && 'iconName' in layer;
}

const toggleSelectedMapItem = (item: any) => {
	const uiStore = useUIStore();
	if (uiStore.selectedMapItem && uiStore.selectedMapItem.id === item.id) {
		uiStore.setSelectedMapItem(null);
	} else {
		uiStore.setSelectedMapItem(item);
	}
};

const toggleMapLayerVisibility = (item: any) => {
	visualizationStore.toggleMapLayerVisibility(item.id);
};

// Handle edit visualization
const editViz = ref<OSHVisualization | null>(null);
const handleEditViz = (viz: OSHVisualization) => {
	useUIStore().openEditViz();	// Open edit wizard
	editViz.value = viz;
}

</script>

<template>
	<v-sheet id="viz-sidebar">
		<v-sheet class="d-flex header-title">
			<h2 class="header-title pa-4">Visualizations</h2>
			<v-tooltip text="Add Visualization" location="bottom">
				<template v-slot:activator="{ props }">
					<IconButton v-bind="props" icon="mdi-plus" aria-label="Add Visualization" @click="useUIStore().openVizWiz()"
					></IconButton>
				</template>
			</v-tooltip>
		</v-sheet>
		<v-divider></v-divider>
		<Audio></Audio>
		<v-sheet class="visualization-list overflow-y-auto">
			<v-expansion-panels multiple eager variant="accordion" elevation="0">
				<!-- MAP VISUALIZATIONS -->
				<v-expansion-panel :disabled="mapVisualizations.length == 0">
					<template #title>
						<div class="panel-header">
							Map Visualizations
						</div>
					</template>
					<v-expansion-panel-text class="panel-text">
						<v-list activatable density="compact" select-strategy="leaf">
							<v-list-item v-for="viz in mapVisualizations" :key="viz.id" @click="toggleSelectedMapItem(viz)">
								<!-- Icon -->
								<template #prepend>
									<v-icon
										:icon="`mdi-${isMapLayer(viz.visualizationComponents.dataLayer) ? viz.visualizationComponents.dataLayer.iconName : ''}`"
										size="16"></v-icon>
								</template>
								<!-- Title -->
								<template #title><span
										:style="`text-decoration: ${visualizationStore.isMapLayerVisible(viz.id) ? '' : 'line-through'}`">{{
											viz.name }}</span></template>
								<!-- Actions -->
								<template #append>
									<div class="map-actions">
										<v-tooltip text="Toggle Visibility" location="bottom">
											<template v-slot:activator="{ props }">
												<IconButton v-bind="props" aria-label="Toggle Visibility" size="x-small" variant="plain"
													:icon="visualizationStore.isMapLayerVisible(viz.id) ? 'mdi-eye' : 'mdi-eye-off'"
													@click.stop="toggleMapLayerVisibility(viz)"></IconButton>
											</template>
										</v-tooltip>
										<v-tooltip text="Edit Visualization" location="bottom">
											<template v-slot:activator="{ props }">
												<IconButton v-bind="props" aria-label="Edit Visualization" size="x-small" variant="plain"
													icon="mdi-pencil" @click.stop="handleEditViz(viz)"></IconButton>
											</template>
										</v-tooltip>
										<DeleteButton label="Remove" @delete="visualizationStore.removeVisualization(viz)"></DeleteButton>
									</div>
								</template>
							</v-list-item>
						</v-list>
					</v-expansion-panel-text>
				</v-expansion-panel>
				<!-- GEOPTZ VISUALIZATIONS -->
				<v-expansion-panel :disabled="geoPtzVisualizations.length == 0">
					<template #title>
						<div class="panel-header">
							GeoPTZ Controllers
						</div>
					</template>
					<v-expansion-panel-text>
						<v-sheet>
							<GeoPTZ v-if="selectedGeoPtzControllers" :visualizations="selectedGeoPtzControllers">
								<template #controllers>
									<v-select label="Process" v-model="selectedGeoPtzControllers" :items="geoPtzVisualizations"
										item-title="name" :item-value="(item: OSHVisualization) => item" chips multiple hide-details
										clearable>
										<template v-slot:item="{ props, item }">
											<v-list-item v-bind="props">
												<template v-slot:prepend="{ isSelected }">
													<v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
												</template>
												<!-- Actions -->
												<template v-slot:append>
													<v-tooltip text="Edit Visualization" location="bottom">
														<template v-slot:activator="{ props }">
															<IconButton v-bind="props" aria-label="Edit Visualization" size="x-small" variant="plain"
																icon="mdi-pencil"
																@click.stop="handleEditViz(visualizationStore.getVisualizationById(item.raw.id)!)">
															</IconButton>
														</template>
													</v-tooltip>
													<DeleteButton label="Remove" @delete="removeGeoPTZ(item.raw)"></DeleteButton>
												</template>
											</v-list-item>
										</template>
									</v-select>
								</template>
							</GeoPTZ>
						</v-sheet>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
			<v-divider></v-divider>
			<!-- PANEL VISUALIZATIONS -->
			<v-expansion-panels :model-value="panelVisualizations.map(v => v.id)" variant="accordion" multiple eager
				elevation="0">
				<v-expansion-panel v-for="viz in panelVisualizations" :key="viz.id" class="visualization-item" :value="viz.id"
					static>
					<template #title>
						<div class="panel-header">
							<span class="viz-name">{{ viz.name }}</span>
							<div class="panel-actions">
								<v-tooltip text="Edit Visualization" location="bottom">
									<template v-slot:activator="{ props }">
										<IconButton v-bind="props" aria-label="Edit Visualization" size="x-small" variant="plain"
											icon="mdi-pencil" @click.stop="handleEditViz(viz)"></IconButton>
									</template>
								</v-tooltip>
								<DeleteButton class="ml-2 mr-2" label="Remove" @delete="visualizationStore.removeVisualization(viz)">
								</DeleteButton>
							</div>
						</div>
					</template>
					<v-expansion-panel-text>
						<VisualizationWrapper :viz="viz">
						</VisualizationWrapper>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-sheet>
	</v-sheet>
	<!-- VISUALIZATION WIZARD -->
	<v-dialog v-model="uiStore.vizWizOpen" max-width="900">
		<VisualizationWizard />
	</v-dialog>
	<!-- EDIT VISUALIZATION -->
	<v-dialog v-model="uiStore.editVizOpen" max-width="900" v-if="editViz">
		<EditVisualization :viz="editViz" />
	</v-dialog>
</template>

<style scoped>
#viz-sidebar {
	width: 100%;
	height: 100%;
}

.header-title {
	text-align: center;
	font-size: 1.5rem;
	font-weight: bold;
	justify-content: center;
	align-items: center;
}

.visualization-list {
	display: flex;
	flex-direction: column;
	overflow-y: scroll;
}

.panel-header {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: space-between;
	min-width: 0;
	}
	
	.panel-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		overflow: hidden;
		max-width: 0;
		opacity: 0;
		transition: max-width 0.2s ease, opacity 0.15s ease;
	}
	
	.map-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		overflow: hidden;
		max-width: 0;
		opacity: 0;
		transition: max-width 0.2s ease, opacity 0.15s ease;
	}
	
	.viz-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.v-expansion-panel:hover .panel-actions {
		max-width: 120px;
		opacity: 1;
	}
	
	.v-list-item:hover .map-actions {
		max-width: 120px;
		opacity: 1;
	}
	
	.panel-text :deep(.v-expansion-panel-text__wrapper) {
		padding-left: 8px;
		padding-right: 8px;
}
</style>
