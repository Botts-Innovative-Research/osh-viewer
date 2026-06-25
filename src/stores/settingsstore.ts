import { ICON_OPTIONS, iconPathBuilder } from '@/lib/icons';
import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';

const persistedMapKeys = {
	map: [
		'focusedMap',
		'geoPtzIcon',
		'geoPtzIconColor',
		'enable3DTerrain',
		'enable3DBuildings',
		'enableGooglePhotorealistic',
	],
};

export const useSettingsStore = defineStore(
	'settings',
	() => {
		// Theme state
		const theme = ref<'dark' | 'light'>('dark');

		// Map
		const focusedMap: Ref<'cesium' | 'leaflet'> = ref('cesium'); // Focused map corresponds to map type

		// GeoPTZ settings
		const geoPtzIcon: Ref<string> = ref(
			iconPathBuilder(ICON_OPTIONS[12].category, ICON_OPTIONS[12].icon)
		);
		const geoPtzIconColor: Ref<string> = ref('#FF0000');

		// Cesium settings
		const enable3DTerrain: Ref<boolean> = ref(true); // Whether to enable 3D terrain in Cesium
		const enable3DBuildings: Ref<boolean> = ref(false); // Whether to show 3D buildings layer in Cesium
		const enableGooglePhotorealistic: Ref<boolean> = ref(true); // Whether to show 3D Google Photorealistic tileset layer in Cesium

		function setTheme(newTheme: 'dark' | 'light') {
			theme.value = newTheme;
		}
		function setFocusedMap(value: 'cesium' | 'leaflet') {
			focusedMap.value = value;
		}

		function setGeoPtzIcon(value: string) {
			geoPtzIcon.value = value;
		}
		function setGeoPtzIconColor(value: string) {
			geoPtzIconColor.value = value;
		}

		function set3DTerrain(value: boolean | null) {
			if (value === null) return;
			enable3DTerrain.value = value;
		}
		function set3DBuildings(value: boolean | null) {
			if (value === null) return;
			enable3DBuildings.value = value;
		}
		function setGooglePhotorealistic(value: boolean | null) {
			if (value === null) return;
			enableGooglePhotorealistic.value = value;
		}

		return {
			theme,
			focusedMap,
			geoPtzIcon,
			geoPtzIconColor,
			enable3DTerrain,
			enable3DBuildings,
			enableGooglePhotorealistic,
			setTheme,
			setFocusedMap,
			setGeoPtzIcon,
			setGeoPtzIconColor,
			set3DTerrain,
			set3DBuildings,
			setGooglePhotorealistic,
		};
	},
	{ persist: { pick: ['theme', ...persistedMapKeys.map] } }
);
