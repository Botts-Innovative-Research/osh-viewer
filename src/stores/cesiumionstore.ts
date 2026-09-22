import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';

export const useCesiumIonStore = defineStore('cesiumIon', () => {
	const accessToken: Ref<string | null> = ref(null);
	const refreshToken: Ref<string | null> = ref(null);
	const isConnected: Ref<boolean> = ref(false);

	function setTokens(access: string, refresh: string | null = null) {
		accessToken.value = access;
		refreshToken.value = refresh;
		isConnected.value = true;
	}

	function disconnect() {
		accessToken.value = null;
		refreshToken.value = null;
		isConnected.value = false;
	}

	return {
		accessToken,
		refreshToken,
		isConnected,
		setTokens,
		disconnect
	}
}, { persist: { pick: ['accessToken', 'refreshToken', 'isConnected'] } })