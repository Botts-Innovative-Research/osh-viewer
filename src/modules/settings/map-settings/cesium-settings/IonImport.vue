<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCesiumIonAssets } from '@/modules/cesium/cesiumIon.service';
import { useCesiumIonStore } from '@/stores/cesiumionstore';

const cesiumIonStore = useCesiumIonStore();
const tab = ref('search');

const headers = [
	{ title: 'Add', key: 'add' },
	{ title: 'ID', key: 'id' },
	{ title: 'Type', key: 'type' },
	{ title: 'Name', key: 'name' },
	{ title: 'Description', key: 'description' },
	{ title: 'Status', key: 'status' },
];

// Fetch assets
const cesiumIonAssets = ref([]);
async function fetchAssets() {
	try {
		const response = await getCesiumIonAssets();
		cesiumIonAssets.value = response.items;
		console.log(response);
	} catch (error) {
		console.error('Failed to fetch Cesium Ion assets:', error);
	}
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
				<v-btn @click="fetchAssets()">Fetch Assets</v-btn>
				<v-data-table-virtual
					:headers="headers"
					:items="cesiumIonAssets"
					height="400"
					item-value="name"
					fixed-header
					class="cesium-asset-table"
				>
					<template #item.add="{ item }">
						<v-btn
							v-if="cesiumIonStore.isAssetAdded(item.id)"
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
							@click="cesiumIonStore.addAsset(item.id)"
						/>
					</template>
				</v-data-table-virtual>
			</v-sheet>
		</v-tabs-window-item>
		<v-tabs-window-item value="manual">
			<v-sheet>
				TBD
			</v-sheet>
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
</style>