<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCesiumIonAsset, getCesiumIonAssets } from '@/modules/cesium/cesiumIon.service';
import { useCesiumIonStore } from '@/stores/cesiumionstore';
import {
	CesiumIonAsset,
	CesiumIonAssetsResponse,
	RESERVED_ASSET_IDS,
} from '@/modules/cesium/types';
import ActionButton from '@/components/ui/ActionButton.vue';
import { showToast } from '@/composables/useToast';

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

// Search assets
const search = ref<string | null>('');
const filteredAssets = computed(() => {
	const query = (search.value ?? '').trim().toLowerCase();

	if (!query) {
		return cesiumIonAssets.value;
	}

	return cesiumIonAssets.value.filter(
		(asset) => asset.id.toString().includes(query) || asset.name.toLowerCase().includes(query)
	);
});

// Manually load asset by ID
const manualAssetId = ref<number | null>();
async function manualFetchAsset() {
	if (!manualAssetId.value) return;

	try {
		const response: CesiumIonAsset = await getCesiumIonAsset(manualAssetId.value);
		cesiumIonStore.addAsset(response);
	} catch (error) {
		console.error(`Failed to fetch Cesium Ion asset: ${manualAssetId.value}`, error);
		showToast(`Failed to fetch asset ${manualAssetId.value}`, 'ERROR');
	}
}
</script>
<template>
	<v-tabs
		v-model="tab"
		class="ma-2"
	>
		<v-tab value="search">Search</v-tab>
		<v-tab value="manual">Manual</v-tab>
	</v-tabs>
	<v-tabs-window
		v-model="tab"
		class="ma-2"
	>
		<v-tabs-window-item value="search">
			<v-sheet class="d-flex flex-column py-2">
				<v-row>
					Search for Cesium Ion assets and add them to your project. Click the plus icon
					to add an asset, or the minus icon to remove it.
				</v-row>
				<v-row class="align-center">
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
						<v-text-field
							v-model="search"
							label="Search by ID or name"
							prepend-inner-icon="mdi-magnify"
							hide-details
							clearable
						></v-text-field>
					</v-col>
				</v-row>
				<v-row class="cesium-asset-table-container">
					<v-data-table-virtual
						:headers="headers"
						:items="filteredAssets"
						max-height="5"
						item-value="id"
						class="cesium-asset-table"
						:loading="loading"
					>
						<template #item="{ item, columns }">
							<tr
								:class="{
									'asset-added': cesiumIonStore.isAssetAdded(item),
								}"
							>
								<td
									v-for="column in columns"
									:key="column.key"
								>
									<template v-if="column.key === 'add'">
										<v-btn
											v-if="cesiumIonStore.isAssetAdded(item)"
											icon="mdi-minus"
											size="small"
											variant="text"
											@click="cesiumIonStore.removeAsset(item.id)"
										/>

										<v-tooltip v-else-if="RESERVED_ASSET_IDS.includes(item.id)">
											<template #activator="{ props }">
												<span v-bind="props">
													<v-btn
														icon="mdi-plus"
														size="small"
														variant="text"
														disabled
													/>
												</span>
											</template>

											This asset is managed by Cesium Ion
										</v-tooltip>

										<v-btn
											v-else
											icon="mdi-plus"
											size="small"
											variant="text"
											@click="cesiumIonStore.addAsset(item)"
										/>
									</template>

									<template v-else-if="column.key === 'description'">
										<div class="description-cell">
											{{ item.description }}
										</div>
									</template>

									<template v-else>
										{{ item[column.key] }}
									</template>
								</td>
							</tr>
						</template>
					</v-data-table-virtual>
				</v-row>
			</v-sheet>
		</v-tabs-window-item>
		<v-tabs-window-item value="manual">
			<v-sheet class="d-flex flex-column py-2">
				<v-row> Manually input a Cesium Ion asset ID to add to your project. </v-row>
				<v-row class="align-center">
					<v-col>
						<v-number-input
							v-model="manualAssetId"
							label="Asset ID"
							type="number"
							variant="outlined"
							inset
							:min="1"
							prepend-inner-icon="mdi-magnify"
							clearable
							hide-details
						/>
					</v-col>
					<v-col cols="auto">
						<ActionButton
							label="Add"
							icon="mdi-plus"
							:disabled="!manualAssetId"
							@submit="manualFetchAsset"
						/>
					</v-col>
				</v-row>
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
.cesium-asset-table-container {
	max-height: 400px;
	overflow-y: auto;
}

.description-cell {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 300px;
}
:deep(.asset-added) {
	background: rgba(var(--v-theme-primary), 0.08);
}
</style>
