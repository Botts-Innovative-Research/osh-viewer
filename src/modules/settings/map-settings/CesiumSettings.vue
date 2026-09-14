<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { computed, ref } from 'vue';
import { showToast } from '@/composables/useToast';
import { useMapStore } from '@/stores/mapstore';
import { useSettingsStore } from '@/stores/settingsstore';

const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const url = ref('');

const focusedMap = computed(() => {
	return settingsStore.focusedMap;
});
const enable3DTerrain = computed({
	get: () => settingsStore.enable3DTerrain,
	set: (val) => settingsStore.set3DTerrain(val),
});
const enable3DBuildings = computed({
	get: () => settingsStore.enable3DBuildings,
	set: (val) => settingsStore.set3DBuildings(val),
});
const enableGooglePhotorealistic = computed({
	get: () => settingsStore.enableGooglePhotorealistic,
	set: (val) => settingsStore.setGooglePhotorealistic(val),
});
const enableEntityClustering = computed({
	get: () => settingsStore.enableEntityClustering,
	set: (val) => settingsStore.setEntityClustering(val),
});
async function addIonAssetUrl() {
	if (focusedMap.value === 'cesium' && url.value) {
		// Check if layer already exists with the same URL
		const exists = mapStore.cesiumMapLayers.some((layer) => layer.url === url.value);
		if (exists) {
			showToast('Layer already exists', 'ERROR');
			return;
		}

		try {
			await mapStore.addLayer(url.value);
			showToast('Layer added successfully', 'SUCCESS');
			url.value = ''; // Clear input on success
		} catch (error: any) {
			console.error(error);
			showToast(error.toString(), 'ERROR');
		}
	}
}
// Can add if URL is valid and Cesium map is selected
const canAddUrl = computed(() => {
	return focusedMap.value === 'cesium' && url.value && url.value.startsWith('http');
});
</script>
<template>
	<v-divider class="ma-2">CESIUM</v-divider>
	<v-list>
		<v-list-item>
			<v-list-item-title>Enable 3D Terrain</v-list-item-title>
			<template #append>
				<v-switch
					v-model="enable3DTerrain"
					color="primary"
					inset="material"
					hide-details
				></v-switch>
			</template>
		</v-list-item>
		<v-list-item>
			<v-list-item-title>Enable 3D Buildings</v-list-item-title>
			<v-list-item-subtitle v-if="!enable3DTerrain && !enableGooglePhotorealistic">
				Requires 3D terrain or photorealistic tiles
			</v-list-item-subtitle>
			<template #append>
				<v-switch
					v-model="enable3DBuildings"
					:disabled="!enable3DTerrain && !enableGooglePhotorealistic"
					color="primary"
					inset="material"
					hide-details
				></v-switch>
			</template>
		</v-list-item>
		<v-list-item>
			<v-list-item-title>Enable 3D Google Photorealistic Tiles</v-list-item-title>
			<template #append>
				<v-switch
					v-model="enableGooglePhotorealistic"
					color="primary"
					inset="material"
					hide-details
				></v-switch>
			</template>
		</v-list-item>
		<v-list-item>
			<v-list-item-title>Enable Entity Clustering</v-list-item-title>
			<template #append>
				<v-switch
					v-model="enableEntityClustering"
					color="primary"
					inset="material"
					hide-details
				></v-switch>
			</template>
		</v-list-item>
		<v-list-item>
			<v-list-item-title>Map Layers</v-list-item-title>
			<v-list-item-subtitle>
				Enter a URL to add a new map service layer
			</v-list-item-subtitle>
			<v-spacer class="ma-4" />
			<v-text-field
				label="Map layer URL"
				v-model="url"
				:rules="[(v) => !v || v.startsWith('http') || 'Must be a valid URL']"
			>
				<template #append-inner>
					<v-btn
						prepend-icon="mdi-plus"
						color="primary"
						:disabled="!canAddUrl"
						@click="addIonAssetUrl"
					>
						Add
					</v-btn>
				</template>
			</v-text-field>
			<v-expansion-panels
				variant="accordion"
				rounded="lg"
				flat
			>
				<v-expansion-panel>
					<v-expansion-panel-title>
						Current Layers
						<v-fade-transition>
							<v-badge
								v-if="mapStore.cesiumMapLayers.length"
								inline
								location="top right"
								:content="mapStore.cesiumMapLayers.length"
								class="pl-2"
							/>
						</v-fade-transition>
					</v-expansion-panel-title>
					<v-expansion-panel-text
						v-if="mapStore.cesiumMapLayers.length"
						class="layer-list"
					>
						<v-list
							activatable
							bg-color="transparent"
						>
							<v-list-item
								v-for="layer in mapStore.cesiumMapLayers"
								:key="layer.id"
								class="ga-2 px-2"
							>
								<template #prepend>
									<DeleteButton
										label="Remove"
										@delete="mapStore.removeLayer(layer.id)"
									>
									</DeleteButton>
								</template>
								<v-list-item-title>{{ layer.url }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-expansion-panel-text>
					<v-expansion-panel-text v-else> No layers added yet. </v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-list-item>
	</v-list>
</template>
