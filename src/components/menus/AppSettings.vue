<script setup lang="ts">
import { useUIStore } from '@/stores/uistore';
import { storeToRefs } from 'pinia';

const uiStore = useUIStore();
const { theme, focusedMap } = storeToRefs(uiStore);

function setTheme(newTheme: 'dark' | 'light') {
	theme.value = newTheme;
}

function setFocusedMap(newMap: 'cesium' | 'leaflet') {
	focusedMap.value = newMap;
}
</script>

<template>
	<v-card class="pa-2">
		<v-card-title>Settings</v-card-title>
		<v-card-text class="d-flex flex-column ga-2">
			<div>
				<v-list-item-title>Theme</v-list-item-title>
				<v-btn-toggle v-model="theme" mandatory class="ga-2">
					<v-btn value="light" @click="setTheme('light')">
						<v-icon>mdi-white-balance-sunny</v-icon>
						Light
					</v-btn>
					<v-btn value="dark" @click="setTheme('dark')">
						<v-icon>mdi-weather-night</v-icon>
						Dark
					</v-btn>
				</v-btn-toggle>
			</div>
			<div>
				<v-list-item-title>Map Type</v-list-item-title>
				<v-btn-toggle v-model="focusedMap" mandatory class="ga-2">
					<v-btn value="leaflet" @click="setFocusedMap('leaflet')">
						Leaflet
					</v-btn>
					<v-btn value="cesium" @click="setFocusedMap('cesium')">
						Cesium
					</v-btn>
				</v-btn-toggle>
			</div>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.v-btn-toggle {
	margin-top: 8px;
}
</style>
