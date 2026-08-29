<script setup lang="ts">
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import GeoOverlayCustomize from '@/modules/map/geo-overlay/components/GeoOverlayCustomize.vue';
import { useGeoOverlayConfig } from '@/modules/map/geo-overlay/composables/useGeoOverlayConfig';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import { MapPoint } from '@/modules/map/types';
import { computed } from 'vue';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';

const emit = defineEmits<{
	close: [];
}>();

function handleSubmit() {
	submit();
	emit('close');
}

const TYPE: GeoOverlayType = 'Point';

const { step, changeStep, toggleTool, submit } = useGeoOverlayConfig({ type: TYPE });

const previewStore = useGeoOverlayPreviewStore();
const mapInteractionStore = useMapInteractionStore();

const lla = computed({
	get: () => previewStore.points[0] ?? { lat: 0, lon: 0, alt: 0 },
	set: (point: MapPoint) => (previewStore.points[0] = point),
});
</script>
<template>
	<v-stepper-vertical
		v-model="step"
		color="primary"
	>
		<v-stepper-vertical-item
			title="Add Point"
			value="1"
			:complete="step > 1"
		>
			<v-expand-transition>
				<h4 class="mt-0">Click on the map to add the point marker.</h4>
			</v-expand-transition>
			<MapPointEditor
				v-model="lla"
				:isSelected="mapInteractionStore.isGeoOverlayPointSelected"
				:isSelectorDisabled="false"
				:hasSubmit="false"
				@toggle="toggleTool"
				class="pb-4"
			></MapPointEditor>
			<template #next>
				<v-btn
					color="primary"
					@click="changeStep(1)"
					:disabled="previewStore.points.length === 0"
					>Next</v-btn
				>
			</template>
			<template #prev></template>
		</v-stepper-vertical-item>
		<v-stepper-vertical-item
			title="Customize Point"
			value="2"
			:complete="step > 2"
		>
			<GeoOverlayCustomize
				defaultName="New Point"
				:type="TYPE"
			/>
			<template #next>
				<v-btn
					color="success"
					@click="handleSubmit"
					:disabled="!previewStore.name"
					>Submit</v-btn
				>
			</template>
			<template #prev>
				<v-btn @click="changeStep(-1)">Previous</v-btn>
			</template>
		</v-stepper-vertical-item>
	</v-stepper-vertical>
</template>
<style scoped></style>
