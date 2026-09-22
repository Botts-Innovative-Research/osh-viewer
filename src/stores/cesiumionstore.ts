import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';

export interface CesiumIonUser {
	id: number;
	username: string;
	email: string;
	avatar: string | null;
}

export const useCesiumIonStore = defineStore('cesiumIon', () => {
	const accessToken: Ref<string | null> = ref(null);
	const refreshToken: Ref<string | null> = ref(null);
	const isConnected: Ref<boolean> = ref(false);

	// User details
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

	return {
		accessToken,
		refreshToken,
		isConnected,
		user,
		setTokens,
		setUser,
		disconnect
	}
}, { persist: { pick: ['accessToken', 'refreshToken', 'user', 'isConnected'] } })