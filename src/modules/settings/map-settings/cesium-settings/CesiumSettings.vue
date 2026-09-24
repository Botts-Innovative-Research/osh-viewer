<script setup lang="ts">
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { computed, ref } from 'vue';
import { showToast } from '@/composables/useToast';
import { useMapStore } from '@/stores/mapstore';
import { useSettingsStore } from '@/stores/settingsstore';
import { connectToCesiumIon } from '@/modules/cesium/cesiumAuth.service';
import { useCesiumIonStore } from '@/stores/cesiumionstore';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog.vue';
import IonImport from '@/modules/settings/map-settings/cesium-settings/IonImport.vue';
import CurrentIonAssets from '@/modules/settings/map-settings/cesium-settings/CurrentIonAssets.vue';
import ActionButton from '@/components/ui/ActionButton.vue';

const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const cesiumIonStore = useCesiumIonStore();
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

// Cesium Ion account login/logout
const connectCesiumIon = () => {
	// Open Cesium Ion connection dialog
	connectToCesiumIon();
};
const showLogoutConfirm = ref(false);
function logoutCesiumIon() {
	cesiumIonStore.disconnect();
	showLogoutConfirm.value = false;
	showToast('Logged out of Cesium Ion', 'INFO');
}

const emit = defineEmits<{
	navigate: [page: 'cesium-import' | 'cesium-upload'];
}>();
</script>
<template>
	<v-card
		variant="outlined"
		class="ma-2"
		v-if="cesiumIonStore.isConnected"
	>
		<v-card-item class="pa-0">
			<v-row class="justify-center align-center">
				<v-col cols="auto">
					<v-avatar :image="cesiumIonStore.user?.avatar ?? ''" />
				</v-col>
				<v-col>
					<v-card-title class="ga-2">
						{{ cesiumIonStore.user?.username }}
					</v-card-title>
					<v-card-subtitle>Connected</v-card-subtitle>
				</v-col>
			</v-row>
		</v-card-item>
		<v-card-text class="px-0 py-2">
			<v-row class="py-2">
				<v-col>
					<ActionButton
						label="Import Assets"
						icon="mdi-import"
						@submit="emit('navigate', 'cesium-import')"
					/>
				</v-col>
				<v-col>
					<ActionButton
						label="Upload Assets"
						icon="mdi-upload"
						@submit="emit('navigate', 'cesium-upload')"
					/>
				</v-col>
			</v-row>
			<v-expansion-panels
				variant="accordion"
				rounded="lg"
				flat
			>
				<v-expansion-panel>
					<v-expansion-panel-title>
						Current Assets
						<v-fade-transition>
							<v-badge
								v-if="cesiumIonStore.addedAssets.length"
								inline
								location="top right"
								:content="cesiumIonStore.addedAssets.length"
								class="pl-2"
							/>
						</v-fade-transition>
					</v-expansion-panel-title>
					<v-expansion-panel-text class="layer-list">
						<CurrentIonAssets />
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-card-text>
		<v-card-actions>
			<v-btn
				color="error"
				variant="tonal"
				@click="showLogoutConfirm = true"
				>Log Out</v-btn
			>
		</v-card-actions>
	</v-card>
	<v-card
		variant="outlined"
		class="ma-2"
		v-else
	>
		<v-card-item>
			<v-card-subtitle>No Cesium Ion account connected</v-card-subtitle>
		</v-card-item>
		<v-card-text>
			Connect your Cesium Ion account to access 3D terrain, 3D buildings, and other Cesium Ion
			features.
		</v-card-text>
		<v-card-actions>
			<v-btn
				prepend-icon="mdi-plus"
				color="primary"
				variant="flat"
				@click="connectCesiumIon"
			>
				Connect Cesium Ion
			</v-btn>
		</v-card-actions>
	</v-card>
	<!-- Settings -->
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
	<ConfirmationDialog
		v-model="showLogoutConfirm"
		title="Log Out of Cesium Ion"
		text="Are you sure you want to disconnect your Cesium Ion account?"
		confirm-text="Log Out"
		@confirm="logoutCesiumIon"
		@cancel="showLogoutConfirm = false"
	/>
</template>
