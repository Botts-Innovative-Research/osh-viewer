<script setup lang="ts">
import { useUIStore } from '@/stores/uistore';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { Ion } from 'cesium';


// THIS token is working, taken from showcase examples :P
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODY0NTkzNS02NzI0LTQwNDktODk4Zi0zZDJjOWI2NTdmYTMiLCJpZCI6MTA1NzQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NTY4NzI1ODJ9.IbAajOLYnsoyKy1BOd7fY1p6GH-wwNVMdMduA2IzGjA';


const ionAsset = ref(null);
const url = ref(null);
const listValues = ref<any[]>([]);
const uiStore = useUIStore();
const { theme, focusedMap, cesiumIonAssetId, cesiumIonAssetUrl } = storeToRefs(uiStore);

function setTheme(newTheme: 'dark' | 'light') {
	theme.value = newTheme;
}

function setFocusedMap(newMap: 'cesium' | 'leaflet') {
	focusedMap.value = newMap;
}

function addIonAsset() {
	if (focusedMap.value === 'cesium' && ionAsset.value) {
		cesiumIonAssetId.value = ionAsset.value;
		ionAsset.value = null;
	}
}

function addIonAssetUrl() {
	if (focusedMap.value === 'cesium' && url.value) {
		cesiumIonAssetUrl.value = url.value;
	}
}

const fetchAssets = async () => {
	const request = Ion.defaultServer + '/v1/assets';
	const options: RequestInit = {};
	options.method = 'GET';
	options.mode = 'cors';
	const TOKEN = Ion.defaultAccessToken;
	if (TOKEN !== undefined && TOKEN !== '') {
		options.headers = {
			Authorization: `Bearer ` + TOKEN,
		};
	}

	const response = await fetch(request, options);
	if (!response.ok) {
		console.error('Failed to retrieve assets from ION server');
	} else {
		const assetList: any[] = await response.json().then((data) => {
			let assets: any[] = [];
			for (let assetInfo of data.items) {
				assets.push(assetInfo);
			}
			return assets;
		});
		listValues.value = assetList;
	}
};

onMounted(() => {
	fetchAssets();
});


</script>

<template>
	<v-card class="pa-2">
		<v-card-title>Settings</v-card-title>
		<v-card-text class="d-flex flex-column ga-2">
			<div>
				<v-list-item-title>Version: 1.0.0</v-list-item-title>
			</div>
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
			<!-- Cesium-specific settings -->
			<div v-if="focusedMap === 'cesium'" class="d-flex flex-column ga-2">
				<v-divider class="my-2" />
				<v-list-item-title>Cesium Settings</v-list-item-title>
				<v-row class="align-start">
					<v-col>
						<v-text-field label="Add Cesium Ion asset by ID" persistent-hint v-model="ionAsset"
							:rules="[v => !v || !isNaN(v) || 'Must be a number']"></v-text-field>
					</v-col>
					<v-col cols="auto">
						<v-btn color="info" @click="addIonAsset()">Add</v-btn>
					</v-col>
				</v-row>
				<v-divider class="my-2" />
				<v-row class="align-start">
					<v-col>
						<v-text-field label="Add Cesium Ion asset by URL" persistent-hint v-model="url"
							:rules="[v => !v || v.startsWith('http') || 'Must be a valid URL']"></v-text-field>
					</v-col>
					<v-col cols="auto">
						<v-btn color="info" @click="addIonAssetUrl()">Add</v-btn>
					</v-col>
				</v-row>
				<v-divider class="my-2" />
				<v-sheet>
					{{ listValues.map((asset) => asset.name) }}
				</v-sheet>
			</div>
		</v-card-text>
	</v-card>
</template>

<style scoped>
.v-btn-toggle {
	margin-top: 8px;
}
</style>
