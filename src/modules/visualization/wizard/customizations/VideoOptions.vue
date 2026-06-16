<script setup lang="ts">
import { watch, ref, computed, onMounted } from 'vue';
import { useVizWizStore } from '@/stores/vizwizstore';

const vwStore = useVizWizStore();

const video360ProjectionMap: Record<string, string> = {
	'Equirectangular': 'equirectangular',
	'Single Fisheye': 'single_fisheye',
	'Dual Fisheye': 'dual_fisheye',
	'Cubemap 3x2': 'cubemap',
};

const FISHEYE_PROJECTIONS = new Set(['single_fisheye', 'dual_fisheye']);

const stats = ref<boolean>(false);
const time = ref<boolean>(false);
const is360 = ref<boolean>(false);
const video360Projection = ref<string>('Equirectangular');
const video360FisheyeFov = ref<number>(190);

const isFisheye = computed(() =>
	FISHEYE_PROJECTIONS.has(video360ProjectionMap[video360Projection.value])
);

function buildProps360() {
	return {
		projection: video360ProjectionMap[video360Projection.value],
		fisheyeFovDeg: isFisheye.value ? video360FisheyeFov.value : undefined,
	};
}

watch(stats, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ stats: val });
});

watch(time, (val) => {
	vwStore.updateVisualizationCustomizationOptions({ time: val });
});

watch(is360, (val) => {
	vwStore.updateVisualizationCustomizationOptions({
		props360: val ? buildProps360() : null,
	});
});

watch(video360Projection, () => {
	if (!is360.value) return;
	vwStore.updateVisualizationCustomizationOptions({ props360: buildProps360() });
});

watch(video360FisheyeFov, () => {
	if (!is360.value) return;
	vwStore.updateVisualizationCustomizationOptions({ props360: buildProps360() });
});

onMounted(() => {
	if (!vwStore.visualizationCustomizationOptions.stats) {
		vwStore.updateVisualizationCustomizationOptions({
			stats: stats.value,
		});
	} else {
		stats.value = vwStore.visualizationCustomizationOptions.stats;
	}

	// Derive is360 from whether props360 is present in the store
	if (!vwStore.visualizationCustomizationOptions.props360) {
		is360.value = false;
	} else {
		is360.value = true;

		if (vwStore.visualizationCustomizationOptions.props360.projection) {
			const label = Object.keys(video360ProjectionMap).find(
				(k) =>
					video360ProjectionMap[k] ===
					vwStore.visualizationCustomizationOptions.props360.projection
			);
			if (label) video360Projection.value = label;
		} else {
			vwStore.updateVisualizationCustomizationOptions({ props360: buildProps360() });
		}

		if (vwStore.visualizationCustomizationOptions.props360.fisheyeFovDeg != null) {
			video360FisheyeFov.value =
				vwStore.visualizationCustomizationOptions.props360.fisheyeFovDeg;
		}

		vwStore.updateVisualizationCustomizationOptions({ props360: buildProps360() });
	}
});
</script>

<template>
	<v-checkbox
		v-model="stats"
		label="Show Video Stats"
	/>
	<v-checkbox
		v-model="time"
		label="Show Video Time"
	/>
	<v-checkbox
		v-model="is360"
		label="Enable 360 View"
	/>
	<v-autocomplete
		v-if="is360"
		v-model="video360Projection"
		:items="Object.keys(video360ProjectionMap)"
		label="Select Input Video Projection"
	/>
	<v-text-field
		v-if="is360 && isFisheye"
		v-model.number="video360FisheyeFov"
		label="Lens Field of View (degrees)"
		type="number"
		:min="90"
		:max="280"
		hint="Full lens FOV in degrees. Roughly 190° for Insta360 cameras."
		persistent-hint
	/>
</template>
