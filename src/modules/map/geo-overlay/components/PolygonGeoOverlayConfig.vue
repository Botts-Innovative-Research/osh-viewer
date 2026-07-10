<script setup lang="ts">
import MapPointCollectionEditor from '@/components/ui/MapPointCollectionEditor.vue';
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import GeoOverlayCustomize from '@/modules/map/geo-overlay/components/GeoOverlayCustomize.vue';
import { useGeoOverlayConfig } from '@/modules/map/geo-overlay/composables/useGeoOverlayConfig';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';

const emit = defineEmits<{
	close: [];
}>();

function handleSubmit() {
	submit();
	emit('close');
}

const TYPE: GeoOverlayType = 'Polygon';

const { step, changeStep, submit } = useGeoOverlayConfig({ type: TYPE });

const previewStore = useGeoOverlayPreviewStore();
</script>
<template>
	<v-stepper-vertical
		v-model="step"
		color="primary"
	>
		<v-stepper-vertical-item
			title="Draw Polygon"
			value="1"
			subtitle="Click on the map to add points for the polygon."
			:complete="step > 1"
		>
			<h4 class="mt-0">Click on the map to add points for the polygon.</h4>
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
			title="Customize Polygon"
			value="2"
			subtitle="Select polygon customizations."
			:complete="step > 2"
		>
			<GeoOverlayCustomize
				defaultName="New Polygon"
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
