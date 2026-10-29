<script setup>
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import HeaderToolbar from '@/components/HeaderToolbar.vue';
import { storeToRefs } from 'pinia';
import { useNodeStore } from '@/stores/nodestore';
import { OSHConnect } from '@/lib/OSHConnectDataStructs';
import { useVisualizationStore } from '@/stores/visualizationstore.js';
import { useSettingsStore } from './stores/settingsstore';
import CesiumOAuthCallback from '@/modules/cesium/CesiumOAuthCallback.vue';

const settingsStore = useSettingsStore();
const { theme } = storeToRefs(settingsStore);

const connect = new OSHConnect();
const nodeStore = useNodeStore();
const visualizationStore = useVisualizationStore();
const route = useRoute();
const isCesiumOAuthCallback = computed(
	() => route.query.cesium_oauth_callback === '1'
);
nodeStore.rehydrateNodes(connect).then(() => {
	visualizationStore.rehydrateVisualizations();
});
</script>

<template>
	<VApp :theme="theme">
		<HeaderToolbar />
		<div class="router-content">
			<CesiumOAuthCallback v-if="isCesiumOAuthCallback" />
			<RouterView v-else />
		</div>
	</VApp>
</template>

<style scoped>
.background {
	height: 100vh;
	width: 100vw;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: flex-start;
	overflow: hidden;
}

@media only screen and (max-width: 600px) {
	.router-content {
		width: 100%;
		height: calc(100vh - 64px); /* Adjust for header height */
	}
}

@media only screen and (min-width: 601px) {
	.router-content {
		width: 100%;
		height: calc(100vh - 64px); /* Adjust for header height */
	}
}

.router-content {
	width: 100%;
	display: flex;
	flex-direction: column;
	overflow: auto;
}
</style>
