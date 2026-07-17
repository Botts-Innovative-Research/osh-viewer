<script setup lang="ts">
import MapPointCollectionEditor from '@/components/ui/MapPointCollectionEditor.vue';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import GeoOverlayCustomize from '@/modules/map/geo-overlay/components/GeoOverlayCustomize.vue';
import { useGeoOverlayConfig } from '@/modules/map/geo-overlay/composables/useGeoOverlayConfig';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import { ref } from 'vue';
import { MapPoint } from '@/modules/map/types';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';

const emit = defineEmits<{
	close: [];
}>();

function handleSubmit() {
	submit();
	emit('close');
}

const TYPE: GeoOverlayType = 'LineString';

const { step, changeStep, toggleTool, submit } = useGeoOverlayConfig({ type: TYPE });
const previewStore = useGeoOverlayPreviewStore();
const mapInteractionStore = useMapInteractionStore();

const tempPoint = ref<MapPoint>({ lat: 0, lon: 0, alt: 0 });
function handleSubmitPoint(point: MapPoint) {
	previewStore.points.push(point);
}
</script>
<template>
	<v-stepper-vertical
		v-model="step"
		color="primary"
	>
		<v-stepper-vertical-item
			title="Draw Polyline"
			value="1"
			subtitle="Click on the map to add points for the polyline."
			:complete="step > 1"
		>
			<h4 class="mt-0">
				Click on the map or manually input LLA to add points for the polyline.
			</h4>
			<MapPointEditor
				v-model="tempPoint"
				:isSelected="mapInteractionStore.isGeoOverlayLineStringSelected"
				:isSelectorDisabled="false"
				@submit="handleSubmitPoint"
				@toggle="toggleTool"
			></MapPointEditor>
			<MapPointCollectionEditor
				v-show="useGeoOverlayPreviewStore().points"
				v-model="previewStore.points"
				title="Points"
			></MapPointCollectionEditor>
			<template #next>
				<v-btn
					color="primary"
					@click="changeStep(1)"
					:disabled="previewStore.points.length < 2"
					>Next</v-btn
				>
			</template>
			<template #prev></template>
		</v-stepper-vertical-item>
		<v-stepper-vertical-item
			title="Customize Polyline"
			value="2"
			subtitle="Select polyline customizations."
			:complete="step > 2"
		>
			<GeoOverlayCustomize
				defaultName="New Polyline"
				:type="TYPE"
			/>
			<template #next>
				<v-btn
					color="success"
					@click="handleSubmit"
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
