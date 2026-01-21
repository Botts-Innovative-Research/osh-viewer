<script setup>
import { RouterView } from 'vue-router';
import HeaderToolbar from '@/components/HeaderToolbar.vue';
import { storeToRefs } from 'pinia';
import { useUIStore } from '@/stores/uistore';
import { useNodeStore } from '@/stores/nodestore';
import { OSHConnect } from '@/lib/OSHConnectDataStructs';
import {useDataStreamStore} from "@/stores/datastreamstore.js";
import {useControlStreamStore} from "@/stores/controlstreamstore.js";
import {useVisualizationStore} from "@/stores/visualizationstore.js";

const uistore = useUIStore();
const { theme } = storeToRefs(uistore);

const connect = new OSHConnect();
const nodeStore = useNodeStore();
const  visualizationStore = useVisualizationStore();
nodeStore.rehydrateNodes(connect).then(() => { visualizationStore.rehydrateVisualizations(); })

</script>

<template>
	<VApp>
		<v-sheet class="background" :theme="theme">
			<HeaderToolbar />
			<div class="router-content">
				<RouterView />
			</div>
		</v-sheet>
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
