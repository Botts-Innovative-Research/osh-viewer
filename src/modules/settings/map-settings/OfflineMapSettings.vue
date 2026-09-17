<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { computed, ref } from 'vue';
import { useSettingsStore } from '@/stores/settingsstore';
import { useMapStore } from '@/stores/mapstore';
import { showToast } from '@/composables/useToast';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { OfflineMapLayer } from '@/modules/map/types';

// Stores
const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const enableOfflineMaps = computed({
	get: () => settingsStore.enableOfflineMaps ?? false,
	set: (val) => settingsStore.setEnableOfflineMaps(val),
});

// Form fields
const fileServerUrl = ref('http://localhost:8080');
const mapName = ref('New Map');
const mapPath = ref('');
const minZoom = ref(12);
const maxZoom = ref(20);
const lat = ref(0);
const lon = ref(0);
const hasBuildings = ref(false);

// Form actions and status
const isFormOpen = ref(false);
const isValid = computed(() => {
	if (
		fileServerUrl.value &&
		mapName.value &&
		mapPath.value &&
		minZoom.value !== null &&
		maxZoom.value !== null &&
		lat.value !== null &&
		lat.value >= -90 &&
		lat.value <= 90 &&
		lon.value !== null &&
		lon.value >= -180 &&
		lon.value <= 180
	)
		return true;
	else return false;
});

async function addMap() {
	mapStore.addOfflineMapLayer({
		id: randomUUID(),
		fileServerUrl: fileServerUrl.value,
		mapName: mapName.value,
		mapPath: mapPath.value,
		minZoom: minZoom.value,
		maxZoom: maxZoom.value,
		lat: lat.value,
		lon: lon.value,
		hasBuildings: hasBuildings.value,
	});

	showToast('Map added successfully', 'SUCCESS');
	isFormOpen.value = false;
	resetForm();
}
function resetForm() {
	fileServerUrl.value = 'http://localhost:8080';
	mapName.value = 'New Map';
	mapPath.value = '';
	minZoom.value = 12;
	maxZoom.value = 20;
	lat.value = 0;
	lon.value = 0;
	hasBuildings.value = false;
}
const cancelForm = () => {
	isFormOpen.value = false;
	resetForm();
};
const onKeyDown = (event: KeyboardEvent) => {
	if (['e', 'E'].includes(event.key)) {
		event.preventDefault();
	}
};

// Fly-to on click
function flyToMap(map: OfflineMapLayer) {
	// If already selected, deselect
	if (
		mapStore.selectedMapItem &&
		'mapName' in mapStore.selectedMapItem &&
		mapStore.selectedMapItem.id === map.id
	) {
		mapStore.setSelectedMapItem(null);
	} else {
		mapStore.setSelectedMapItem(map);
	}
}
</script>
<template>
	<v-card style="padding: 0px">
		<v-card-item>
			<v-card-title>Offline Map Settings</v-card-title>
			<v-card-subtitle>Configure offline maps.</v-card-subtitle>
		</v-card-item>
		<v-card-text class="pa-2 d-flex flex-column ga-2">
			<v-list>
				<v-list-item>
					<v-list-item-title>Enable Offline Maps</v-list-item-title>
					<template #append>
						<v-switch
							v-model="enableOfflineMaps"
							color="primary"
							inset="material"
							hide-details
						></v-switch>
					</template>
				</v-list-item>
				<v-list-item>
					<v-fade-transition v-if="!isFormOpen">
						<v-btn
							@click="isFormOpen = true"
							block
							variant="tonal"
							color="primary"
							prepend-icon="mdi-plus-circle"
							>Add Offline Map</v-btn
						>
					</v-fade-transition>
					<v-fade-transition v-else>
						<v-btn
							@click="cancelForm"
							block
							variant="outlined"
							color="default"
							prepend-icon="mdi-close"
							>Cancel</v-btn
						>
					</v-fade-transition>
				</v-list-item>
				<v-expand-transition>
					<v-list-item v-if="isFormOpen">
						<v-form
							@submit.prevent="addMap()"
							class="d-flex flex-column pt-4 ga-2"
						>
							<v-text-field
								label="File Server Path"
								v-model="fileServerUrl"
								placeholder="http://localhost:8080"
								:rules="[(v) => !!v || 'File Server Path is required']"
								required
							/>
							<v-text-field
								label="Map Name"
								v-model="mapName"
								placeholder="New Map"
								:rules="[(v) => !!v || 'Map Name is required']"
								required
							/>
							<v-text-field
								label="Map Path"
								v-model="mapPath"
								placeholder="maps/field"
								:rules="[(v) => !!v || 'Map Path is required']"
								required
							/>
							<v-row>
								<v-col cols="6">
									<v-number-input
										label="Min Zoom"
										v-model="minZoom"
										placeholder="12"
										variant="outlined"
										inputmode="numeric"
										@onkeydown="onKeyDown"
										:rules="[(v) => !!v || 'Min Zoom is required']"
										required
									/>
								</v-col>
								<v-col cols="6">
									<v-number-input
										label="Max Zoom"
										v-model="maxZoom"
										placeholder="20"
										variant="outlined"
										inputmode="numeric"
										@onkeydown="onKeyDown"
										:rules="[(v) => !!v || 'Max Zoom is required']"
										required
									/>
								</v-col>
							</v-row>
							<v-row class="mt-0">
								<v-col cols="6">
									<v-text-field
										label="Center Latitude"
										v-model="lat"
										placeholder="0.0"
										hint="-90 to 90"
										min="-90"
										max="90"
										variant="outlined"
										type="number"
										@onkeydown="onKeyDown"
										hide-spin-buttons
										:rules="[
											(v) =>
												(v !== null && v !== undefined) ||
												'Latitude is required',
											(v) => (v >= -90 && v <= 90) || 'Must be -90 to 90',
										]"
										required
									/>
								</v-col>
								<v-col cols="6"
									><v-text-field
										label="Center Longitude"
										v-model="lon"
										placeholder="0.0"
										hint="-180 to 180"
										min="-180"
										max="180"
										variant="outlined"
										type="number"
										@onkeydown="onKeyDown"
										hide-spin-buttons
										:rules="[
											(v) =>
												(v !== null && v !== undefined) ||
												'Longitude is required',
											(v) => (v >= -180 && v <= 180) || 'Must be -180 to 180',
										]"
										required
								/></v-col>
							</v-row>
							<v-list-item class="pa-0 ma-0">
								<v-list-item-title>Has Buildings (Cesium)</v-list-item-title>
								<v-list-item-subtitle
									>Toggle if the map set includes <i>buildings.geojson</i> in the
									map path</v-list-item-subtitle
								>
								<template #append>
									<v-switch
										v-model="hasBuildings"
										color="primary"
										inset="material"
										hide-details
									></v-switch>
								</template>
							</v-list-item>

							<!-- Buttons inside the form -->
							<v-card-actions>
								<v-btn
									type="submit"
									color="primary"
									variant="tonal"
									:disabled="!isValid"
									>Add Offline Map</v-btn
								>
							</v-card-actions>
						</v-form>
					</v-list-item>
				</v-expand-transition>
				<v-list-item>
					<v-expansion-panels
						variant="accordion"
						rounded="lg"
						flat
					>
						<v-expansion-panel>
							<v-expansion-panel-title>
								Current Offline Maps
								<v-fade-transition>
									<v-badge
										v-if="mapStore.offlineMapLayers.length"
										inline
										location="top right"
										:content="mapStore.offlineMapLayers.length"
										class="pl-2"
									/>
								</v-fade-transition>
							</v-expansion-panel-title>
							<v-expansion-panel-text
								v-if="mapStore.offlineMapLayers.length"
								class="layer-list"
							>
								<v-list
									activatable
									bg-color="transparent"
								>
									<v-list-item
										v-for="map in mapStore.offlineMapLayers"
										:key="map.id"
										class="ga-2 px-2"
										@click="flyToMap(map)"
									>
										<template #prepend>
											<DeleteButton
												label="Remove"
												@delete="mapStore.removeOfflineMapLayer(map.id)"
											>
											</DeleteButton>
										</template>
										<v-list-item-title>{{ map.mapName }}</v-list-item-title>
									</v-list-item>
								</v-list>
							</v-expansion-panel-text>
							<v-expansion-panel-text v-else>
								No offline maps added yet.
							</v-expansion-panel-text>
						</v-expansion-panel>
					</v-expansion-panels>
				</v-list-item>
			</v-list>
		</v-card-text>
	</v-card>
</template>
<style scoped>
:deep(.layer-list .v-expansion-panel-text__wrapper) {
	padding: 8px;
}
</style>
