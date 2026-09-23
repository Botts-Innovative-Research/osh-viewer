<script setup lang="ts">
import { useMapStore } from '@/stores/mapstore';
import { computed, ref } from 'vue';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { showToast } from '@/composables/useToast';
import { useSettingsStore } from '@/stores/settingsstore';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import IconPicker from '@/components/ui/IconPicker.vue';
import { ICON_OPTIONS } from '@/lib/icons';
import CesiumSettings from '@/modules/settings/map-settings/CesiumSettings.vue';

const settingsStore = useSettingsStore();

const focusedMap = computed({
	get: () => settingsStore.focusedMap,
	set: (val) => settingsStore.setFocusedMap(val),
});

const geoPtzIcon = computed({
	get: () => settingsStore.geoPtzIcon,
	set: (val) => settingsStore.setGeoPtzIcon(val),
});
const geoPtzIconColor = computed({
	get: () => settingsStore.geoPtzIconColor,
	set: (val) => settingsStore.setGeoPtzIconColor(val),
});
</script>

<template>
	<v-list>
		<v-list-item>
			<v-list-item-title>Map Type</v-list-item-title>
			<template #append>
				<v-btn-toggle
					v-model="focusedMap"
					mandatory
					class="ga-2"
				>
					<v-btn value="leaflet"> Leaflet </v-btn>
					<v-btn value="cesium"> Cesium </v-btn>
				</v-btn-toggle>
			</template>
		</v-list-item>
		<v-divider class="ma-2">GeoPTZ</v-divider>
		<v-list-item>
			<v-list-item-title>Icon</v-list-item-title>
			<template #append>
				<IconPicker
					v-model="geoPtzIcon"
					:icon-options="
						ICON_OPTIONS.filter((option) => option.category === 'geoptz')
					"
				></IconPicker>
			</template>
		</v-list-item>
		<v-list-item>
			<v-list-item-title>Icon Color</v-list-item-title>
			<template #append>
				<ColorPicker v-model="geoPtzIconColor"></ColorPicker>
			</template>
		</v-list-item>
	</v-list>
</template>
<style scoped>
:deep(.layer-list .v-expansion-panel-text__wrapper) {
	padding: 8px;
}
</style>
