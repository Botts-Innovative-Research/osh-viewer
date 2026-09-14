import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import { MapInteractionMode, useMapInteractionStore } from '@/stores/mapinteractionstore';

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

		// Circle initialization
		if (options.type === 'Circle') {
			previewStore.circleCreationStep = 'center';
		}
	}

	watch(step, (newStep) => {
		// Tool should be active on first step only
		if (newStep === 1) {
			// Don't reselect for circle if already added
			if (options.type === 'Circle' && previewStore.points.length) {
				return;
			} else {
				mapInteractionStore.selectTool(mapTool.value);
			}
		}
		if (newStep === 2) {
			mapInteractionStore.deselectTool(mapTool.value);
		}
	});

	function changeStep(delta: number) {
		step.value += delta;
	}

	function deselectTool() {
		mapInteractionStore.deselectTool(mapTool.value);
		previewStore.circleCreationStep = null;
	}

	function toggleTool() {
		mapInteractionStore.toggleTool(mapTool.value);
		if (mapInteractionStore.isGeoOverlayCircleSelected)
			previewStore.circleCreationStep = 'center';
	}

	function keyboardClick(event: KeyboardEvent) {
		// Use 'Escape' (case-sensitive) to deselect tool
		if (event.key === 'Escape') deselectTool();
	}

	function submit() {
		mapInteractionStore.deselectTool(mapTool.value);
		previewStore.submit();
	}

	// Update step on tool reselection
	watch(
		() => mapInteractionStore.interactionMode,
		(activeTool) => {
			if (activeTool === mapTool.value) step.value = 1;
		}
	);

	onMounted(async () => {
		await init();
		window.addEventListener('keydown', keyboardClick);
	});
	onUnmounted(() => {
		mapInteractionStore.deselectTool(mapTool.value);
		previewStore.reset();
		window.removeEventListener('keydown', keyboardClick);
	});

	return {
		step,
		mapTool,
		toggleTool,
		changeStep,
		submit,
	};
}
