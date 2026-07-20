<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useMapStore } from '@/stores/mapstore';
import { sendGeoPTZCommand } from '@/modules/map/services/geoPTZ.service';
import { GeoPTZCommand } from './Descriptor';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

// Values for LLA inputs
const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(0.0);

const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();
const isSelected = computed(() => mapInteractionStore.isGeoPTZSelected);

// Watch for changes in currentLLA to update input fields, IF selected
watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isSelected.value && newVal) {
			latInput.value = newVal.latitude;
			lonInput.value = newVal.longitude;
			altInput.value = newVal.altitude;
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
		parameters: {
			lat: latInput.value,
			lon: lonInput.value,
			alt: altInput.value,
		},
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
		<v-row
			class="d-flex align-center"
			no-gutters
		>
			<v-col
				class="pr-4"
				cols="auto"
			>
				<v-tooltip
					:text="
						props.visualizations.length === 0
							? 'No GeoPTZ controllers selected'
							: 'Select map click-to-task'
					"
					location="top"
				>
					<template #activator="{ props: tooltipProps }">
						<span
							v-bind="tooltipProps"
							style="display: inline-block"
						>
							<IconButton
								icon
								:color="isSelected ? 'primary' : 'grey'"
								@click="toggle"
								:disabled="props.visualizations.length === 0"
								class="pa-0"
								size="default"
								rounded="xl"
							>
								<v-icon>{{
									isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'
								}}</v-icon>
							</IconButton>
						</span>
					</template>
				</v-tooltip>
			</v-col>
			<v-col>
				<slot name="controllers"></slot>
			</v-col>
		</v-row>
		<v-divider
			class="my-4"
			v-if="props.visualizations.length > 0"
		></v-divider>
		<v-row :style="{ display: props.visualizations.length > 0 ? 'block' : 'none' }">
			<v-col no-gutters>
				<v-number-input
					v-model.number="latInput"
					variant="outlined"
					label="Latitude (-90 to 90)"
					placeholder="0.0"
					:min="-90"
					:max="90"
				/>
				<v-number-input
					v-model.number="lonInput"
					variant="outlined"
					label="Longitude (-180 to 180)"
					placeholder="0.0"
					:min="-180"
					:max="180"
				/>
				<v-number-input
					v-model.number="altInput"
					variant="outlined"
					label="Altitude"
					placeholder="0.0"
					:min="-9999"
					:max="99999"
				/>
				<v-btn
					color="primary"
					prepend-icon="mdi-send"
					@click="onSend"
					block
					>Send</v-btn
				>
			</v-col>
		</v-row>
	</v-container>
</template>

<style scoped></style>
