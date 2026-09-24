<script setup lang="ts">
import { computed, ref } from 'vue';
import MapSettings from './map-settings/MapSettings.vue';
import GeneralSettings from './GeneralSettings.vue';
import OfflineMapSettings from '@/modules/settings/map-settings/OfflineMapSettings.vue';
import CesiumIcon from '@/components/icons/Cesium_logo_only.svg';
import CesiumSettings from '@/modules/settings/map-settings/cesium-settings/CesiumSettings.vue';
import IonImport from '@/modules/settings/map-settings/cesium-settings/IonImport.vue';
import IonUpload from '@/modules/settings/map-settings/cesium-settings/IonUpload.vue';

// Nav drawer state
const selectedTab = ref(['general']);
const pages = ref([
	{ name: 'General', value: 'general', icon: 'mdi-cog', parent: null },
	{ name: 'Map', value: 'map', icon: 'mdi-map', parent: null },
	{ name: 'Cesium Ion', value: 'cesium-map', icon: CesiumIcon, parent: 'map' },
	{
		name: 'Import Assets',
		value: 'cesium-import',
		icon: 'mdi-import',
		parent: 'cesium-map',
	},
	{
		name: 'Upload Assets',
		value: 'cesium-upload',
		icon: 'mdi-upload',
		parent: 'cesium-map',
	},
	{ name: 'Offline Map', value: 'offline-map', icon: 'mdi-cloud-off-outline', parent: 'map' },
]);
const selectedPage = computed(() =>
	pages.value.find((page) => page.value === selectedTab.value[0])
);
const breadcrumbs = computed(() => {
	const items: string[] = [];
	let page = selectedPage.value;

	while (page) {
		items.unshift(page.name);
		if (!page.parent) {
			break;
		}
		page = pages.value.find((item) => item.value === page.parent);
	}

	return items;
});
function handleCesiumNavigation(page: 'cesium-import' | 'cesium-upload') {
	selectedTab.value = [page];
}
function getPageDepth(page: (typeof pages.value)[number]) {
	let depth = 0;
	let parent = page.parent;

	while (parent) {
		depth++;
		const parentPage = pages.value.find((item) => item.value === parent);
		parent = parentPage?.parent ?? null;
	}

	return depth;
}

// @ts-ignore
const appVersion = APP_VERSION;
</script>

<template>
	<v-card>
		<v-card-item>
			<v-card-title>Settings</v-card-title>
			<v-card-subtitle>Version: {{ appVersion }}</v-card-subtitle>
		</v-card-item>
		<v-card-text class="px-2">
			<v-row density="compact">
				<v-col cols="3">
					<v-navigation-drawer
						permanent
						style="position: relative"
					>
						<v-list
							nav
							v-model:selected="selectedTab"
							mandatory
						>
							<v-list-item
								v-for="page in pages"
								:key="page.value"
								:value="page.value"
								:style="{ '--page-indent': `${getPageDepth(page) * 16}px` }"
								class="settings-page-item"
							>
								<template #prepend>
									<v-icon :icon="page.icon" />
								</template>
								<v-list-item-title>{{ page.name }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-navigation-drawer>
				</v-col>
				<v-col cols="9">
					<v-window v-model="selectedTab">
						<v-window-item
							v-for="page in pages"
							:key="page.value"
							:value="page.value"
						>
							<v-card style="padding: 0px">
								<v-card-item>
									<v-breadcrumbs
										class="pa-0 ma-0"
										:items="breadcrumbs"
									/>
								</v-card-item>

								<v-card-text class="pa-0">
									<GeneralSettings v-if="page.value === 'general'" />
									<MapSettings v-else-if="page.value === 'map'" />
									<CesiumSettings
										v-else-if="page.value === 'cesium-map'"
										@navigate="handleCesiumNavigation"
									/>
									<IonImport v-else-if="page.value === 'cesium-import'" />
									<IonUpload v-else-if="page.value === 'cesium-upload'" />
									<OfflineMapSettings
										v-else-if="page.value === 'offline-map'"
									/>
								</v-card-text>
							</v-card>
						</v-window-item>
					</v-window>
				</v-col>
			</v-row>
		</v-card-text>
	</v-card>
</template>

<style scoped>
:deep(.layer-list .v-expansion-panel-text__wrapper) {
	padding: 8px;
}
.settings-page-item :deep(.v-list-item__prepend) {
	margin-left: var(--page-indent);
}
</style>
