<script setup xmlns="http://www.w3.org/1999/html" lang="ts">
import { Ion } from 'cesium';
import { useMap } from '../composables/useMap';

Ion.defaultAccessToken =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNDIyMzU2OC0wMWI4LTRjNGYtYTdiMy1kYjRmYzAwNGJkYTgiLCJpZCI6MzM1ODkzLCJpYXQiOjE3NTYzMDQ3MjZ9.5-F-lSal7TV6bHASnlpo5JCxamD0ppGPtQT7GUK5Ne4';

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
