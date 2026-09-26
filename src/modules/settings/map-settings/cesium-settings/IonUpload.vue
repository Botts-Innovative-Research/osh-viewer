<script setup lang="ts">
import { createCesiumAsset } from '@/modules/cesium/cesiumUpload.service';

async function test() {
	const asset = await createCesiumAsset({
		name: 'OSH Viewer Test',
		description: 'Test upload from OSH Viewer',
		type: '3DTILES',
		options: {
			sourceType: 'CITYGML',
		},
	});

	console.log('Created Cesium asset:', asset);
}
</script>
<template>
	<v-btn @click="test">Test Upload</v-btn>
</template>
