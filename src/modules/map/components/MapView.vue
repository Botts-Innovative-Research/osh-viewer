<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import { useMap } from '../composables/useMap';
import Settings from '@/modules/settings/Settings.vue';
import { useCesiumIonStore } from '@/stores/cesiumionstore';
import CesiumRequiredDialog from '@/modules/map/components/CesiumRequiredDialog.vue';

const { mapAdapter, mapType } = useMap();
const cesiumIonStore = useCesiumIonStore();
</script>

<template>
	<div
		v-if="mapType !== 'cesium' || cesiumIonStore.isConnected"
		class="maphero"
		id="mapContainer"
	></div>
	<CesiumRequiredDialog v-if="mapType === 'cesium' && !cesiumIonStore.isConnected" />
</template>

<style>
.maphero {
	height: 100%;
	width: auto;
}
</style>
