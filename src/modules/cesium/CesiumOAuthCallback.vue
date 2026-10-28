<script setup lang="ts">
import { onMounted } from 'vue';
import { exchangeCesiumCode, getCesiumIonUser, setCesiumIonToken } from './cesiumAuth.service';
import { useCesiumIonStore } from '@/stores/cesiumionstore';
import * as Cesium from 'cesium';
import { useRouter } from 'vue-router';

onMounted(async () => {
	const router = useRouter();

	const params = new URLSearchParams(window.location.search);

	const code = params.get('code');

	if (!code) {
		console.error('No Cesium authorization code found');
		return;
	}

	try {
		const tokens = await exchangeCesiumCode(code);
		const user = await getCesiumIonUser(tokens.access_token);

		const cesiumIonStore = useCesiumIonStore();

		cesiumIonStore.setTokens(tokens.access_token, tokens.refresh_token ?? null);
		cesiumIonStore.setUser(user);

		setCesiumIonToken(tokens.access_token);

		console.log('Connected to Cesium Ion', cesiumIonStore.isConnected);

		await router.push('/');
	} catch (error) {
		console.error('Cesium OAuth failed:', error);
	}
});
</script>

<template>
	<v-sheet class="d-flex flex-column justify-center align-center h-100">
		<h2>Connecting to Cesium Ion...</h2>
		<v-progress-circular
			indeterminate
			color="primary"
		></v-progress-circular>
	</v-sheet>
</template>
