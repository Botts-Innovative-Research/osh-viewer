import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import { CesiumIonAsset, CesiumIonUser } from '@/modules/cesium/types';

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
				addedAssets.value = [
					...addedAssets.value,
					asset,
				];
			}
		}
		function removeAsset(assetId: number) {
			addedAssets.value = addedAssets.value.filter((item) => item.id !== assetId);
		}
		function isAssetAdded(asset: CesiumIonAsset): boolean {
			return addedAssets.value.some((item) => item.id === asset.id);
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
		};
	},
	{ persist: { pick: ['accessToken', 'refreshToken', 'user', 'isConnected', 'addedAssets'] } }
);