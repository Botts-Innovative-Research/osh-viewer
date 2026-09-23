import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';

export interface CesiumIonUser {
	id: number;
	username: string;
	email: string;
	avatar: string | null;
}

export const useCesiumIonStore = defineStore('cesiumIon', () => {
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
		console.log(profile);
	}
	function disconnect() {
		accessToken.value = null;
		refreshToken.value = null;
		user.value = null;
		isConnected.value = false;
	}

	// Ion Assets
	const addedAssetIds = ref<number[]>([]);
	function addAsset(assetId: number) {
		if (!addedAssetIds.value.includes(assetId)) {
			addedAssetIds.value.push(assetId);
		}
	}
	function removeAsset(assetId: number) {
		addedAssetIds.value = addedAssetIds.value.filter(id => id !== assetId);
	}
	function isAssetAdded(assetId: number): boolean {
		return addedAssetIds.value.includes(assetId);
	}

	return {
		accessToken,
		refreshToken,
		isConnected,
		user,
		setTokens,
		setUser,
		disconnect,
		addedAssetIds,
		addAsset,
		removeAsset,
		isAssetAdded
	}
}, { persist: { pick: ['accessToken', 'refreshToken', 'user', 'isConnected'] } })