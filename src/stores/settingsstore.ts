import { ICON_OPTIONS, iconPathBuilder } from '@/lib/icons';
import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';

const persistedMapKeys = {
	map: ['focusedMap', 'enableOfflineMaps', 'geoPtzIcon', 'geoPtzIconColor'],
};

export const useSettingsStore = defineStore(
	'settings',
	() => {
		// Theme state
		const theme = ref<'dark' | 'light'>('dark');

		// Map
		const focusedMap: Ref<'cesium' | 'leaflet'> = ref('cesium'); // Focused map corresponds to map type
		const enableOfflineMaps: Ref<boolean> = ref(false); // Whether offline maps are toggled on

		// GeoPTZ settings
		const geoPtzIcon: Ref<string> = ref(
			iconPathBuilder(ICON_OPTIONS[12].category, ICON_OPTIONS[12].icon)
		);
		const geoPtzIconColor: Ref<string> = ref('#FF0000');

		// Cesium settings

		function setTheme(newTheme: 'dark' | 'light') {
			theme.value = newTheme;
		}
		function setFocusedMap(value: 'cesium' | 'leaflet') {
			focusedMap.value = value;
		}
		function setEnableOfflineMaps(value: boolean) {
			enableOfflineMaps.value = value;
		}

		function setGeoPtzIcon(value: string) {
			geoPtzIcon.value = value;
		}
		function setGeoPtzIconColor(value: string) {
			geoPtzIconColor.value = value;
		}

		return {
			theme,
			focusedMap,
			enableOfflineMaps,
			geoPtzIcon,
			geoPtzIconColor,
			setTheme,
			setFocusedMap,
			setEnableOfflineMaps,
			setGeoPtzIcon,
			setGeoPtzIconColor,
		};
	},
	{ persist: { pick: ['theme', ...persistedMapKeys.map] } }
);
