<script setup lang="ts">
import { onMounted } from 'vue';
import { exchangeCesiumCode, setCesiumIonToken } from './cesiumAuth.service';
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

		const cesiumIonStore = useCesiumIonStore();

		cesiumIonStore.setTokens(tokens.access_token, tokens.refresh_token ?? null);

		setCesiumIonToken(tokens.access_token);

		console.log('Connected to Cesium Ion', cesiumIonStore.isConnected);

		await router.push('/');
	} catch (error) {
		console.error('Cesium OAuth failed:', error);
	}
});
</script>

<template>
	<div>Connecting to Cesium Ion...</div>
</template>
