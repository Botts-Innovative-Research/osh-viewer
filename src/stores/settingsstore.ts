import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';

const persistedMapKeys = {
  map: ['focusedMap', 'enable3DTerrain', 'enable3DBuildings'],
}

export const useSettingsStore = defineStore(
	'settings',
	() => {
		// Theme state
		const theme = ref<'dark' | 'light'>('dark');

    // Map
    const focusedMap: Ref<'cesium' | 'leaflet'> = ref('cesium'); // Focused map corresponds to map type

		// Cesium settings
		const enable3DTerrain: Ref<boolean> = ref(true); // Whether to enable 3D terrain in Cesium
		const enable3DBuildings: Ref<boolean> = ref(true); // Whether to show 3D buildings layer in Cesium

		function setTheme(newTheme: 'dark' | 'light') {
			theme.value = newTheme;
		}
		function setFocusedMap(value: 'cesium' | 'leaflet') {
			focusedMap.value = value;
		}

		function set3DTerrain(value: boolean | null) {
			if (value === null) return;
			enable3DTerrain.value = value;
		}
		function set3DBuildings(value: boolean | null) {
			if (value === null) return;
			enable3DBuildings.value = value;
		}

		return {
			theme,
      focusedMap,
			enable3DTerrain,
			enable3DBuildings,
			setTheme,
      setFocusedMap,
			set3DTerrain,
			set3DBuildings,
		};
	},
	{ persist: { pick: ['theme', ...persistedMapKeys.map] } }
);
