<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useMapStore } from '@/stores/mapstore';
import { sendGeoPTZCommand } from '@/modules/map/services/geoPTZ.service';
import { GeoPTZCommand } from './Descriptor';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import type { MapPoint } from '@/modules/map/types';

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

// Values for LLA inputs
const editorPoint = ref<MapPoint>({ lat: 0, lon: 0, alt: 0 });

const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();
const isSelected = computed(() => mapInteractionStore.isGeoPTZSelected);

// Watch for changes in currentLLA to update input fields, IF selected
watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isSelected.value && newVal) {
			editorPoint.value = {
				lat: newVal.latitude,
				lon: newVal.longitude,
				alt: newVal.altitude,
			};
		}
	}
);

// Update selected GeoPTZ list
watch(
	() => props.visualizations,
	(newVal) => {
		mapInteractionStore.setSelectedGeoPTZ(newVal);
	}
);

// Toggle selection of GeoPTZ in UI store and locally
function toggle() {
	mapInteractionStore.toggleTool('geoptz');
	if (mapInteractionStore.isGeoPTZSelected)
		mapInteractionStore.setSelectedGeoPTZ(props.visualizations);
}

// Send PTZ command based on LLA inputs
function onSend() {
	// Ensure newly selected controllers are added
	mapInteractionStore.setSelectedGeoPTZ(props.visualizations);

	const command: GeoPTZCommand = {
		parameters: editorPoint.value,
	};

	if (mapInteractionStore.selectedGeoPTZ) {
		sendGeoPTZCommand(mapInteractionStore.selectedGeoPTZ, command);
	} else {
		console.warn('[GeoPtzView] No GeoPTZ selected, cannot send command');
	}
}

onBeforeUnmount(() => {
	// Deselect GeoPTZ before unmount
	mapInteractionStore.clearSelectedGeoPTZ();
	mapInteractionStore.deselectTool('geoptz');
});
</script>

<template>
	<v-container
		fluid
		class="py-4"
	>
		<slot name="controllers"></slot>
		<v-expand-transition>
			<div v-if="props.visualizations.length > 0">
				<v-divider class="my-4"></v-divider>
				<MapPointEditor
					v-model="editorPoint"
					:is-selected="isSelected"
					:is-selector-disabled="props.visualizations.length === 0"
					submit-icon="mdi-send"
					submit-label="Send"
					@submit="onSend"
					@toggle="toggle"
					class="pb-0"
				/>
			</div>
		</v-expand-transition>
	</v-container>
</template>

<style scoped></style>
