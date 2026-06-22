<script setup lang="ts">
// @ts-ignore
import PanelVisualizationWrapper from './PanelVisualizationWrapper.vue';
import GeoPTZ from '@/modules/visualization/visualizations/geoptz/GeoPTZ.vue';
import VisualizationWizard from '@/modules/visualization/wizard/VisualizationWizard.vue';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { useVisualizationSidebar } from '../composables/useVisualizationSidebar';
import { useUIStore } from '@/stores/uistore';
import MapVisualizationWrapper from './MapVisualizationWrapper.vue';
import GeoPtzWrapper from './GeoPtzWrapper.vue';
import MissionWrapper from '@/modules/visualization/sidebar/components/MissionWrapper.vue';
import MissionBuilder from '@/modules/visualization/visualizations/mission/MissionBuilder.vue';
import { VueDraggable } from 'vue-draggable-plus';

const {
	editViz,
	panelVisualizations,
	mapVisualizations,
	geoPtzVisualizations,
	openPanels,
	openPanelVisualizations,
	selectedGeoPTZControllers,
	removeGeoPTZ,
	missionVisualizations,
	selectedMissionControllers,
	removeMission,
	isMapLayerVisible,
	toggleMapLayerVisibility,
	toggleSelectedMapItem,
	removeVisualization,
	openEditViz,
} = useVisualizationSidebar();

const uiStore = useUIStore();
</script>

<template>
	<v-sheet id="viz-sidebar">
		<v-sheet class="d-flex header-title">
			<h2 class="header-title pa-4">Visualizations</h2>
			<v-tooltip
				text="Add Visualization"
				location="bottom"
			>
				<template v-slot:activator="{ props }">
					<IconButton
						v-bind="props"
						icon="mdi-plus"
						aria-label="Add Visualization"
						@click="uiStore.openVizWiz"
					>
					</IconButton>
				</template>
			</v-tooltip>
		</v-sheet>
		<v-divider></v-divider>
		<v-sheet class="visualization-list overflow-y-auto">
			<v-expansion-panels
				multiple
				eager
				variant="accordion"
				elevation="0"
				v-model="openPanels"
			>
				<!-- MAP VISUALIZATIONS -->
				<v-expansion-panel
					:disabled="mapVisualizations.length == 0"
					value="map"
				>
					<template #title>
						<div class="panel-header">Map Visualizations</div>
					</template>
					<v-expansion-panel-text class="panel-text">
						<VueDraggable
							v-model="mapVisualizations"
							item-key="id"
							:animation="150"
							tag="div"
							style="display: contents"
						>
							<MapVisualizationWrapper
								v-for="viz in mapVisualizations"
								:viz="viz"
								:toggleSelectedMapItem="toggleSelectedMapItem"
								:isMapLayerVisible="isMapLayerVisible"
								:toggleMapLayerVisibility="toggleMapLayerVisibility"
								:openEditViz="openEditViz"
								:removeVisualization="removeVisualization"
							/>
						</VueDraggable>
					</v-expansion-panel-text>
				</v-expansion-panel>
				<!-- GEOPTZ VISUALIZATIONS -->
				<v-expansion-panel
					:disabled="geoPtzVisualizations.length == 0"
					value="geoptz"
				>
					<template #title>
						<div class="panel-header">GeoPTZ Controllers</div>
					</template>
					<v-expansion-panel-text>
						<v-sheet>
							<GeoPTZ
								v-if="selectedGeoPTZControllers"
								:visualizations="selectedGeoPTZControllers"
							>
								<template #controllers>
									<GeoPtzWrapper
										v-model:selectedGeoPTZControllers="
											selectedGeoPTZControllers
										"
										:geoPtzVisualizations="geoPtzVisualizations"
										:openEditViz="openEditViz"
										:removeGeoPTZ="removeGeoPTZ"
									/>
								</template>
							</GeoPTZ>
						</v-sheet>
					</v-expansion-panel-text>
				</v-expansion-panel>
<!--				Mission Builder Visualizations-->
				<v-expansion-panel
					:disabled="missionVisualizations.length == 0"
					value="mission"
				>
					<template #title>
						<div class="panel-header">Mission Builder Controllers</div>
					</template>
					<v-expansion-panel-text>
						<v-sheet>
							<MissionBuilder
								v-if="selectedMissionControllers"
								:visualizations="selectedMissionControllers"
							>
								<template #controllers>
									<MissionWrapper
										v-model:selectedMissionControllers="
											selectedMissionControllers
										"
										:missionVisualizations="missionVisualizations"
										:openEditViz="openEditViz"
										:removeMission="removeMission"
									/>
								</template>
							</MissionBuilder>
						</v-sheet>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
			<v-divider></v-divider>
			<!-- PANEL VISUALIZATIONS -->
			<v-expansion-panels
				v-model="openPanelVisualizations"
				variant="accordion"
				multiple
				eager
				elevation="0"
			>
				<VueDraggable
					v-model="panelVisualizations"
					item-key="id"
					:animation="150"
					tag="div"
					style="display: contents"
				>
					<v-expansion-panel
						v-for="viz in panelVisualizations"
						:key="viz.id"
						class="visualization-item"
						:value="viz.id"
						static
					>
						<template #title>
							<div class="panel-header">
								<span class="viz-name">{{ viz.name }}</span>
								<div class="panel-actions">
									<v-tooltip
										text="Edit Visualization"
										location="bottom"
									>
										<template v-slot:activator="{ props }">
											<IconButton
												v-bind="props"
												aria-label="Edit Visualization"
												size="x-small"
												variant="plain"
												icon="mdi-pencil"
												@click.stop="openEditViz(viz)"
											></IconButton>
										</template>
									</v-tooltip>
									<DeleteButton
										class="ml-2 mr-2"
										label="Remove"
										@delete="removeVisualization(viz)"
									>
									</DeleteButton>
								</div>
							</div>
						</template>
						<v-expansion-panel-text>
							<PanelVisualizationWrapper :viz="viz"></PanelVisualizationWrapper>
						</v-expansion-panel-text>
					</v-expansion-panel>
				</VueDraggable>
			</v-expansion-panels>
		</v-sheet>
	</v-sheet>
	<!-- VISUALIZATION WIZARD -->
	<v-dialog
		v-model="uiStore.vizWizOpen"
		max-width="900"
	>
		<VisualizationWizard
			mode="create"
			:viz="undefined"
		/>
	</v-dialog>
	<!-- EDIT VISUALIZATION -->
	<v-dialog
		v-model="uiStore.editVizOpen"
		max-width="900"
		v-if="editViz?.id"
	>
		<VisualizationWizard
			mode="edit"
			:viz="editViz"
		/>
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
	transition:
		max-width 0.2s ease,
		opacity 0.15s ease;
}

.map-actions {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	overflow: hidden;
	max-width: 0;
	opacity: 0;
	transition:
		max-width 0.2s ease,
		opacity 0.15s ease;
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
