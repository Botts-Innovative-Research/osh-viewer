<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { MapPoint } from '@/modules/map/types';
import { onMounted, ref } from 'vue';
import MapPointCollectionEditor from '@/components/ui/MapPointCollectionEditor.vue';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import GeoOverlayCustomize from '@/modules/map/geo-overlay/components/GeoOverlayCustomize.vue';
import { useGeoOverlayConfig } from '@/modules/map/geo-overlay/composables/useGeoOverlayConfig';

const TYPE = 'LineString';

const { step, init, changeStep, submit } = useGeoOverlayConfig({ type: TYPE });

const previewStore = useGeoOverlayPreviewStore();

onMounted(init);
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
			<h4>Click on the map to add points for the polyline.</h4>
			<MapPointCollectionEditor
				:model-value="previewStore.points ?? []"
			></MapPointCollectionEditor>
			<template #next>
				<v-btn
					color="primary"
					@click="changeStep(1)"
					>Next</v-btn
				>
			</template>
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
					@click="submit"
					>Submit</v-btn
				>
			</template>
		</v-stepper-vertical-item>
	</v-stepper-vertical>
</template>
<style scoped></style>
