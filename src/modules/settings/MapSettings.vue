<script setup lang="ts">
import { useMapStore } from '@/stores/mapstore';
import { computed, ref } from 'vue';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { showToast } from '@/composables/useToast';
import { useSettingsStore } from '@/stores/settingsstore';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import IconPicker from '@/components/ui/IconPicker.vue';
import { ICON_OPTIONS } from '@/lib/icons';

const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const url = ref('');

const focusedMap = computed({
	get: () => settingsStore.focusedMap,
	set: (val) => settingsStore.setFocusedMap(val),
});

const geoPtzIcon = computed({
	get: () => settingsStore.geoPtzIcon,
	set: (val) => settingsStore.setGeoPtzIcon(val),
});
const geoPtzIconColor = computed({
	get: () => settingsStore.geoPtzIconColor,
	set: (val) => settingsStore.setGeoPtzIconColor(val),
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
	<v-card class="elevation-0">
		<v-card-item>
			<v-card-title>Map Settings</v-card-title>
			<v-card-subtitle>Configure map-related settings.</v-card-subtitle>
		</v-card-item>
		<v-card-text class="pl-0">
			<v-list>
				<v-list-item>
					<v-list-item-title>Map Type</v-list-item-title>
					<template #append>
						<v-btn-toggle
							v-model="focusedMap"
							mandatory
							class="ga-2"
						>
							<v-btn value="leaflet"> Leaflet </v-btn>
							<v-btn value="cesium"> Cesium </v-btn>
						</v-btn-toggle>
					</template>
				</v-list-item>
				<v-divider class="ma-2">GeoPTZ</v-divider>
				<v-list-item>
					<v-list-item-title>Icon</v-list-item-title>
					<template #append>
						<IconPicker
							v-model="geoPtzIcon"
							:icon-options="
								ICON_OPTIONS.filter((option) => option.category === 'geoptz')
							"
						></IconPicker>
					</template>
				</v-list-item>
				<v-list-item>
					<v-list-item-title>Icon Color</v-list-item-title>
					<template #append>
						<ColorPicker v-model="geoPtzIconColor"></ColorPicker>
					</template>
				</v-list-item>
				<!-- Cesium-specific Settings -->
				<v-expand-transition>
					<div v-if="focusedMap === 'cesium'">
						<v-divider class="ma-2">CESIUM</v-divider>
						<v-list-item>
							<v-list-item-title>Enable 3D Terrain</v-list-item-title>
							<template #append>
								<v-switch
									v-model="enable3DTerrain"
									color="primary"
									inset
									hide-details
								></v-switch>
							</template>
						</v-list-item>
						<v-list-item>
							<v-list-item-title>Enable 3D Buildings</v-list-item-title>
							<template #append>
								<v-switch
									v-model="enable3DBuildings"
									color="primary"
									inset
									hide-details
								></v-switch>
							</template>
						</v-list-item>
						<v-list-item>
							<v-list-item-title
								>Enable 3D Google Photorealistic Tiles</v-list-item-title
							>
							<template #append>
								<v-switch
									v-model="enableGooglePhotorealistic"
									color="primary"
									inset
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
								:rules="[
									(v) => !v || v.startsWith('http') || 'Must be a valid URL',
								]"
							>
								<template #append-inner>
									<v-btn
										prepend-icon="mdi-plus"
										color="info"
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
										<v-badge
											v-if="mapStore.cesiumMapLayers.length"
											inline
											location="top right"
											:content="mapStore.cesiumMapLayers.length"
											class="pl-2"
										/>
									</v-expansion-panel-title>
									<v-expansion-panel-text
										v-if="mapStore.cesiumMapLayers.length"
										class="layer-list"
									>
										<v-list activatable>
											<v-list-item
												v-for="layer in mapStore.cesiumMapLayers"
												:key="layer.id"
												class="pl-4"
											>
												<template #prepend>
													<DeleteButton
														label="Remove"
														@delete="mapStore.removeLayer(layer.id)"
													>
													</DeleteButton>
												</template>
												<v-list-item-title>{{
													layer.url
												}}</v-list-item-title>
											</v-list-item>
										</v-list>
									</v-expansion-panel-text>
									<v-expansion-panel-text v-else>
										No layers added yet.
									</v-expansion-panel-text>
								</v-expansion-panel>
							</v-expansion-panels>
						</v-list-item>
					</div>
				</v-expand-transition>
			</v-list>
		</v-card-text>
	</v-card>
</template>
<style scoped>
:deep(.layer-list .v-expansion-panel-text__wrapper) {
	padding: 0;
}
.iconButton {
	font-size: 35px;
}
</style>
