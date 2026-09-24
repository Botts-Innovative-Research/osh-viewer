<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCesiumIonAssets } from '@/modules/cesium/cesiumIon.service';
import { useCesiumIonStore } from '@/stores/cesiumionstore';
import { CesiumIonAsset, CesiumIonAssetsResponse } from '@/modules/cesium/types';

const loading = ref(true);
const cesiumIonStore = useCesiumIonStore();
const tab = ref('search');

const headers = [
	{ title: 'Add', key: 'add' },
	{ title: 'ID', key: 'id' },
	{ title: 'Type', key: 'type' },
	{ title: 'Name', key: 'name' },
	{ title: 'Description', key: 'description' },
];

// Fetch assets
const cesiumIonAssets = ref<CesiumIonAsset[]>([]);
async function fetchAssets() {
	loading.value = true;
	try {
		const response: CesiumIonAssetsResponse = await getCesiumIonAssets();
		cesiumIonAssets.value = response.items;
	} catch (error) {
		console.error('Failed to fetch Cesium Ion assets:', error);
	}
	loading.value = false;
}
onMounted(() => {
	fetchAssets();
});
</script>
<template>
	<v-tabs
		v-model="tab"
		class="mb-2"
	>
		<v-tab value="search">Search</v-tab>
		<v-tab value="manual">Manual</v-tab>
	</v-tabs>
	<v-tabs-window v-model="tab">
		<v-tabs-window-item value="search">
			<v-sheet>
				<v-row class="my-2">
					<v-col cols="auto">
						<v-tooltip
							text="Fetch Assets"
							location="bottom"
						>
							<template v-slot:activator="{ props }">
								<IconButton
									v-bind="props"
									aria-label="Fetch Assets"
									@click="fetchAssets"
									icon="mdi-refresh"
									variant="outlined"
								></IconButton>
							</template>
						</v-tooltip>
					</v-col>
					<v-col>
						Search for Cesium Ion assets and add them to your project. Click the plus icon to add an asset, or the minus icon to remove it.
					</v-col>
				</v-row>
				<v-data-table-virtual
					:headers="headers"
					:items="cesiumIonAssets"
					height="400"
					item-value="id"
					fixed-header
					class="cesium-asset-table"
					:loading="loading"
				>
					<template #item.add="{ item }">
						<v-btn
							v-if="cesiumIonStore.isAssetAdded(item)"
							icon="mdi-minus"
							size="small"
							variant="text"
							@click="cesiumIonStore.removeAsset(item.id)"
						/>
						<v-btn
							v-else
							icon="mdi-plus"
							size="small"
							variant="text"
							@click="cesiumIonStore.addAsset(item)"
						/>
					</template>
					<template #item.description="{ item }">
						<div class="description-cell">
							{{ item.description }}
						</div>
					</template>
				</v-data-table-virtual>
			</v-sheet>
		</v-tabs-window-item>
		<v-tabs-window-item value="manual">
			<v-sheet> TBD </v-sheet>
		</v-tabs-window-item>
	</v-tabs-window>
</template>

<style scoped>
.cesium-asset-table :deep(table) {
	table-layout: auto;
}
.cesium-asset-table :deep(td),
.cesium-asset-table :deep(th) {
	padding-top: 2px;
	padding-bottom: 2px;
}

.description-cell {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 300px;
}
</style>