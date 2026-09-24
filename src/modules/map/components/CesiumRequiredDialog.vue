<script setup lang="ts">
import { connectToCesiumIon } from '@/modules/cesium/cesiumAuth.service';

const connectCesiumIon = () => {
	// Open Cesium Ion connection dialog
	connectToCesiumIon();
};
</script>
<template>
	<v-card
		variant="outlined"
		class="ma-2 z-3000"
	>
		<v-card-item>
			<v-card-subtitle>No Cesium Ion account connected</v-card-subtitle>
		</v-card-item>
		<v-card-text>
			Connect your Cesium Ion account to access 3D terrain, 3D buildings, and other Cesium Ion
			features.
		</v-card-text>
		<v-card-actions>
			<v-btn
				prepend-icon="mdi-plus"
				color="primary"
				variant="flat"
				@click="connectCesiumIon"
			>
				Connect Cesium Ion
			</v-btn>
		</v-card-actions>
	</v-card>
</template>
