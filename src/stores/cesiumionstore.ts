import { defineStore } from 'pinia';
import { computed, ref, Ref } from 'vue';
import { CesiumIonAsset, CesiumIonUser } from '@/modules/cesium/types';
import { has } from 'vuetify/lib/util';

const persistedMapKeys = [
	'accessToken',
	'refreshToken',
	'user',
	'isConnected',
	'addedAssets',
	'enable3DTerrain',
	'enable3DBuildings',
	'enableGooglePhotorealistic',
	'enableEntityClustering',
];

export const useCesiumIonStore = defineStore(
	'cesiumIon',
	() => {
		// Authentication/login
		const accessToken: Ref<string | null> = ref(null);
		const refreshToken: Ref<string | null> = ref(null);
		const isConnected: Ref<boolean> = ref(false);
		const user: Ref<CesiumIonUser | null> = ref(null);
		function setTokens(access: string, refresh: string | null = null) {
			accessToken.value = access;
			refreshToken.value = refresh;
			isConnected.value = true;
		}
		function setUser(profile: CesiumIonUser) {
			user.value = profile;
		}
		function disconnect() {
			accessToken.value = null;
			refreshToken.value = null;
			user.value = null;
			isConnected.value = false;

			// Remove all added assets when disconnecting
			addedAssets.value = [];
		}

		// Ion Assets
		const addedAssets = ref<CesiumIonAsset[]>([]);
		function addAsset(asset: CesiumIonAsset) {
			if (!addedAssets.value.some((item) => item.id === asset.id)) {
				addedAssets.value = [...addedAssets.value, asset];
			}
		}
		function removeAsset(assetId: number) {
			addedAssets.value = addedAssets.value.filter((item) => item.id !== assetId);
		}
		function isAssetAdded(asset: CesiumIonAsset): boolean {
			return addedAssets.value.some((item) => item.id === asset.id);
		}

		// General settings
		const enable3DTerrain: Ref<boolean> = ref(false); // Whether to enable 3D terrain
		const enableGooglePhotorealistic: Ref<boolean> = ref(true); // Whether to show 3D Google Photorealistic tileset layer
		const enable3DBuildings: Ref<boolean> = ref(false); // Whether to show 3D buildings layer
		const enableEntityClustering: Ref<boolean> = ref(true); // Whether to cluster entities
		const hasSurface = computed(() => {
			// If neither terrain is turned on, set false - else true
			return !(!enable3DTerrain.value && !enableGooglePhotorealistic.value);
		});

		// Buildings need a surface to sit on (terrain or photorealistic tiles).
		// With neither on there's nothing to place them on, so force them off.
		// The UI also greys out the buildings toggle in that state.
		function syncBuildingsToSurface() {
			console.log(hasSurface.value);
			if (!hasSurface.value) {
				console.log('Turned off: ', hasSurface.value);
				enable3DBuildings.value = false;
			}
		}
		function set3DTerrain(value: boolean | null) {
			if (value === null) return;

			if (value) {
				enable3DTerrain.value = true;
				enableGooglePhotorealistic.value = false; // Mutually exclusive - turn off Google photorealistic
			} else {
				enable3DTerrain.value = false;
			}

			syncBuildingsToSurface();
		}
		function setGooglePhotorealistic(value: boolean | null) {
			if (value === null) return;

			if (value) {
				enableGooglePhotorealistic.value = true;
				enable3DTerrain.value = false; // Mutually exclusive - turn off 3d terrain
			} else {
				enableGooglePhotorealistic.value = false;
			}

			syncBuildingsToSurface();
		}
		function set3DBuildings(value: boolean | null) {
			if (value === null) return;

			if (value) {
				enable3DBuildings.value = true;
			} else {
				enable3DBuildings.value = false;
			}

			syncBuildingsToSurface();
		}
		function setEntityClustering(value: boolean | null) {
			if (value === null) return;
			enableEntityClustering.value = value;
		}

		return {
			accessToken,
			refreshToken,
			isConnected,
			user,
			setTokens,
			setUser,
			disconnect,
			addedAssets,
			addAsset,
			removeAsset,
			isAssetAdded,
			enable3DTerrain,
			enable3DBuildings,
			enableGooglePhotorealistic,
			enableEntityClustering,
			set3DTerrain,
			set3DBuildings,
			setGooglePhotorealistic,
			setEntityClustering,
		};
	},
	{ persist: { pick: persistedMapKeys } }
);
