<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import { Ion } from 'cesium';
import { useMap } from '../composables/useMap';

const { mapAdapter } = useMap();
</script>

<template>
	<div
		class="maphero"
		id="mapContainer"
	></div>
</template>

<style>
.maphero {
	height: 100%;
	width: auto;
}
</style>
