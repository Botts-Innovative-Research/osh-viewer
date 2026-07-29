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
        'enableEntityClustering'
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
		const enableEntityClustering: Ref<boolean> = ref(true); // Whether to cluster entities

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

		// Buildings need a surface to sit on (terrain or photorealistic tiles).
		// With neither on there's nothing to place them on, so force them off.
		// The UI also greys out the buildings toggle in that state.
		function syncBuildingsToSurface() {
			if (!enable3DTerrain.value && !enableGooglePhotorealistic.value) {
				enable3DBuildings.value = false;
			}
		}
		function set3DTerrain(value: boolean | null) {
			if (value === null) return;
			enable3DTerrain.value = value;
			// Terrain and photorealistic tiles are mutually exclusive surfaces (#365).
			if (value) enableGooglePhotorealistic.value = false;
			syncBuildingsToSurface();
		}
		function set3DBuildings(value: boolean | null) {
			if (value === null) return;
			enable3DBuildings.value = value;
			// Buildings need a surface. If photorealistic tiles aren't already
			// providing one, force terrain on so buildings don't float above the
			// ellipsoid (#365). When photorealistic IS on, leave it — buildings can
			// overlay it, which helps in areas where the photoreal mesh has artifacts.
			if (value && !enableGooglePhotorealistic.value) {
				enable3DTerrain.value = true;
			}
		}
		function setGooglePhotorealistic(value: boolean | null) {
			if (value === null) return;
			enableGooglePhotorealistic.value = value;
			// Photorealistic tiles and terrain are mutually exclusive surfaces (#365).
			if (value) enable3DTerrain.value = false;
			syncBuildingsToSurface();
		}
        function setEntityClustering(value: boolean | null) {
            if (value === null) return;
            enableEntityClustering.value = value;
        }

		return {
			theme,
			focusedMap,
			geoPtzIcon,
			geoPtzIconColor,
			enable3DTerrain,
			enable3DBuildings,
			enableGooglePhotorealistic,
            enableEntityClustering,
			setTheme,
			setFocusedMap,
			setGeoPtzIcon,
			setGeoPtzIconColor,
			set3DTerrain,
			set3DBuildings,
			setGooglePhotorealistic,
            setEntityClustering
		};
	},
	{ persist: { pick: ['theme', ...persistedMapKeys.map] } }
);
