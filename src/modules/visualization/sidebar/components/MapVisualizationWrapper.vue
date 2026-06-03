<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { isMapLayerCompatible, VisualizationRegistry } from '../../registry/VisualizationRegistry';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { computed, ref, watch } from 'vue';
import { useMapStore } from '@/stores/mapstore';

const {
	viz,
	toggleSelectedMapItem,
	isMapLayerVisible,
	toggleMapLayerVisibility,
	openEditViz,
	removeVisualization,
} = defineProps<{
	viz: OSHVisualization;
	toggleSelectedMapItem: (item: any) => void;
	isMapLayerVisible: (id: string) => boolean;
	toggleMapLayerVisibility: (item: any) => void;
	openEditViz: (viz: string | OSHVisualization) => void;
	removeVisualization: (viz: OSHVisualization) => void;
}>();

const mapStore = useMapStore();
function isSelected(viz: OSHVisualization) {
	if (!mapStore.selectedMapItem) return false;
	return mapStore.selectedMapItem?.id === viz.id;
}

function getIcon(viz: OSHVisualization) {
	// Parent visualizations - use viz type icon
	if (viz.isParentVisualization()) {
		return VisualizationRegistry[viz.type].icon ?? 'mdi-folder';
	}
	// Use iconName from dataLayer
	const iconName = viz.visualizationComponents.dataLayer.iconName;
	if (iconName) {
		if (viz.visualizationComponents.dataLayer.iconOpacity === 0) {
			console.log(
				`Visualization ${viz.name} has iconName defined but iconOpacity is set to 0. Defaulting to type icon.`
			);
			return VisualizationRegistry[viz.type].icon ?? 'mdi-shape';
		}
		return `mdi-${iconName}`;
	}
	// Otherwise, use viz type icon
	else {
		return VisualizationRegistry[viz.type].icon ?? 'mdi-shape';
	}
}
function getIconColor(viz: OSHVisualization) {
	if (viz.isParentVisualization()) {
		return 'default';
	}
	// Handle visualizations that have both iconColor and color
	if (
		viz.visualizationComponents.dataLayer?.iconColor &&
		viz.visualizationComponents.dataLayer?.color
	) {
		if (viz.visualizationComponents.dataLayer?.iconOpacity === 0) {
			console.log(
				`Visualization ${viz.name} has both iconColor and color defined, but iconOpacity is set to 0. Using color for icon display.`
			);
			return viz.visualizationComponents.dataLayer.color;
		}
		console.log(
			`Visualization ${viz.name} has both iconColor and color defined. Using iconColor for icon display.`
		);
	}
	// Handle remaining cases, with preference to iconColor
	return (
		viz.visualizationComponents.dataLayer?.iconColor ||
		viz.visualizationComponents.dataLayer?.color ||
		'default'
	);
}

// Parent viz logic
const childrenOpen = ref(false);
function handleParentClick(viz: OSHVisualization) {
	toggleSelectedMapItem(viz);

	// Only toggle children if this is a parent visualization
	if (!viz.isParentVisualization()) return;

	if (mapStore.selectedMapItem === viz) {
		childrenOpen.value = true;
	} else {
		childrenOpen.value = false;
	}
}
function handleParentVisibilityToggle(viz: OSHVisualization) {
	toggleMapLayerVisibility(viz);

	// Only toggle visibility of children if this is a parent visualization
	if (!viz.isParentVisualization()) return;

	// If making parent visible, also make children visible
	const makeVisible = isMapLayerVisible(viz.id);
	viz.children.forEach((childViz) => {
		if (makeVisible && !isMapLayerVisible(childViz.id)) {
			toggleMapLayerVisibility(childViz);
		} else if (!makeVisible && isMapLayerVisible(childViz.id)) {
			toggleMapLayerVisibility(childViz);
		}
	});
}

watch(
	() => mapStore.selectedMapItem,
	(newVal) => {
		// If selected item is this visualization or one of its children, keep children open. Otherwise, close children.
		if (!newVal) {
			childrenOpen.value = false;
			return;
		}
		if (newVal.id === viz.id || viz.children.some((child) => child.id === newVal.id)) {
			childrenOpen.value = true;
		} else {
			childrenOpen.value = false;
		}
	}
);
</script>

<template>
	<v-list
		activatable
		density="compact"
		select-strategy="leaf"
		class="pa-0"
	>
		<!-- Single visualizations -->
		<v-list-item
			v-if="viz.isSingleVisualization()"
			:key="viz.id"
			:active="isSelected(viz)"
			@click="toggleSelectedMapItem(viz)"
		>
			<!-- Icon -->
			<template #prepend>
				<v-tooltip
					text="Visualization not supported by this map type."
					location="bottom"
					:disabled="isMapLayerCompatible(viz.type)"
				>
					<template v-slot:activator="{ props }">
						<v-badge
							location="top right"
							color="warning"
							dot
							:model-value="!isMapLayerCompatible(viz.type)"
							v-bind="props"
						>
							<v-icon
								:icon="getIcon(viz)"
								:color="getIconColor(viz)"
								size="16"
							></v-icon>
						</v-badge>
					</template>
				</v-tooltip>
			</template>
			<!-- Title -->
			<template #title
				><span
					:style="`text-decoration: ${isMapLayerVisible(viz.id) ? '' : 'line-through'}`"
					>{{ viz.name }}</span
				></template
			>
			<!-- Actions -->
			<template #append>
				<div class="map-actions">
					<v-tooltip
						text="Toggle Visibility"
						location="bottom"
					>
						<template v-slot:activator="{ props }">
							<IconButton
								v-bind="props"
								aria-label="Toggle Visibility"
								size="x-small"
								variant="plain"
								:icon="isMapLayerVisible(viz.id) ? 'mdi-eye' : 'mdi-eye-off'"
								@click.stop="toggleMapLayerVisibility(viz)"
							></IconButton>
						</template>
					</v-tooltip>
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
						label="Remove"
						@delete="removeVisualization(viz)"
					></DeleteButton>
				</div>
			</template>
		</v-list-item>
		<!-- Parent visualizations -->
		<div
			v-if="viz.isParentVisualization()"
			@mouseenter="childrenOpen = true"
			@mouseleave="
				isSelected(viz) || viz.children.some((child) => isSelected(child))
					? (childrenOpen = true)
					: (childrenOpen = false)
			"
		>
			<v-list-item
				:key="viz.id"
				:active="isSelected(viz)"
				@click="handleParentClick(viz)"
			>
				<!-- Icon -->
				<template #prepend>
					<v-tooltip
						text="Visualization not supported by this map type."
						location="bottom"
						:disabled="isMapLayerCompatible(viz.type)"
					>
						<template v-slot:activator="{ props }">
							<v-badge
								location="top right"
								color="warning"
								dot
								:model-value="!isMapLayerCompatible(viz.type)"
								v-bind="props"
							>
								<v-icon
									:icon="getIcon(viz)"
									:color="getIconColor(viz)"
									size="16"
								></v-icon>
							</v-badge>
						</template>
					</v-tooltip>
				</template>
				<!-- Title -->
				<template #title
					><span
						:style="`text-decoration: ${isMapLayerVisible(viz.id) ? '' : 'line-through'}`"
						>{{ viz.name }}</span
					></template
				>
				<!-- Actions -->
				<template #append>
					<div class="map-actions">
						<v-tooltip
							text="Toggle Visibility"
							location="bottom"
						>
							<template v-slot:activator="{ props }">
								<IconButton
									v-bind="props"
									aria-label="Toggle Visibility"
									size="x-small"
									variant="plain"
									:icon="isMapLayerVisible(viz.id) ? 'mdi-eye' : 'mdi-eye-off'"
									@click.stop="handleParentVisibilityToggle(viz)"
								></IconButton>
							</template>
						</v-tooltip>
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
							label="Remove"
							@delete="removeVisualization(viz)"
						></DeleteButton>
					</div>
				</template>
			</v-list-item>
			<!-- Children -->
			<v-expand-transition>
				<v-list
					v-show="childrenOpen"
					activatable
					density="compact"
					select-strategy="leaf"
					class="ml-4"
				>
					<v-list-item
						v-for="childViz in viz.children"
						:key="childViz.id"
						:active="isSelected(childViz)"
						@click="toggleSelectedMapItem(childViz)"
					>
						<!-- Icon -->
						<template #prepend>
							<v-tooltip
								text="Visualization not supported by this map type."
								location="bottom"
								:disabled="isMapLayerCompatible(childViz.type)"
							>
								<template v-slot:activator="{ props }">
									<v-badge
										location="top right"
										color="warning"
										dot
										:model-value="!isMapLayerCompatible(childViz.type)"
										v-bind="props"
									>
										<v-icon
											:icon="getIcon(childViz)"
											:color="getIconColor(childViz)"
											size="16"
										></v-icon>
									</v-badge>
								</template>
							</v-tooltip>
						</template>
						<!-- Title -->
						<template #title
							><span
								:style="`text-decoration: ${isMapLayerVisible(childViz.id) ? '' : 'line-through'}`"
								>{{ childViz.name }}</span
							></template
						>
						<!-- Actions -->
						<template #append>
							<div class="map-actions">
								<v-tooltip
									text="Toggle Visibility"
									location="bottom"
								>
									<template v-slot:activator="{ props }">
										<IconButton
											v-bind="props"
											aria-label="Toggle Visibility"
											size="x-small"
											variant="plain"
											:icon="
												isMapLayerVisible(childViz.id)
													? 'mdi-eye'
													: 'mdi-eye-off'
											"
											@click.stop="toggleMapLayerVisibility(childViz)"
										></IconButton>
									</template>
								</v-tooltip>
							</div>
						</template>
					</v-list-item>
				</v-list>
			</v-expand-transition>
		</div>
	</v-list>
</template>

<style scoped>
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

.v-list-item:hover .map-actions {
	max-width: 120px;
	opacity: 1;
}
</style>
