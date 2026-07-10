import { computed, onMounted, onUnmounted, ref } from 'vue';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import { MapInteractionMode, useMapInteractionStore } from '@/stores/mapinteractionstore';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';

export function useGeoOverlayConfig(options: { type: GeoOverlayType }) {
	// Stores
	const previewStore = useGeoOverlayPreviewStore();
	const mapInteractionStore = useMapInteractionStore();

	// States
	const step = ref<number>(1);
	const mapTool = computed((): MapInteractionMode => {
		if (options.type === 'Point') return 'geoOverlayPoint';
		else if (options.type === 'Circle') return 'geoOverlayCircle';
		else if (options.type === 'LineString') return 'geoOverlayLineString';
		else return 'geoOverlayPolygon';
	});

	async function init() {
		// Reset preview store
		previewStore.reset();

		// Initialize preview store
		previewStore.type = options.type;

		// Select correct tool
		mapInteractionStore.selectTool(mapTool.value);
	}

	function changeStep(delta: number) {
		step.value += delta;

		// Tool should be active on first step only
		if (step.value === 1) {
			mapInteractionStore.selectTool(mapTool.value);
		}
		if (step.value === 2) {
			mapInteractionStore.deselectTool(mapTool.value);
		}
	}

	function submit() {
		mapInteractionStore.deselectTool(mapTool.value);
		previewStore.submit();
	}

	onMounted(init);
	onUnmounted(() => {
		mapInteractionStore.deselectTool(mapTool.value);
		previewStore.reset();
	});

	return {
		step,
		mapTool,
		changeStep,
		submit,
	};
}
