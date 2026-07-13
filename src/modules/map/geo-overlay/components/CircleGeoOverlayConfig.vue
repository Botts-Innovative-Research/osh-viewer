<script setup lang="ts">
import { useGeoOverlayPreviewStore } from '@/stores/geooverlaypreviewstore';
import GeoOverlayCustomize from '@/modules/map/geo-overlay/components/GeoOverlayCustomize.vue';
import { useGeoOverlayConfig } from '@/modules/map/geo-overlay/composables/useGeoOverlayConfig';
import { GeoOverlayType } from '@/modules/map/geo-overlay/types';
import { MapPoint } from '@/modules/map/types';
import { computed, onMounted, ref } from 'vue';

const emit = defineEmits<{
	close: [];
}>();

function handleSubmit() {
	submit();
	emit('close');
}

const TYPE: GeoOverlayType = 'Circle';

const { step, changeStep, submit } = useGeoOverlayConfig({ type: TYPE });

const previewStore = useGeoOverlayPreviewStore();

const lla = computed({
	get: () => previewStore.points[0],
	set: (point: MapPoint) => (previewStore.points[0] = point),
});
</script>
<template>
	<v-stepper-vertical
		v-model="step"
		color="primary"
	>
		<v-stepper-vertical-item
			title="Draw Circle"
			value="1"
			:complete="step > 1"
		>
			<h4 class="mt-0">1. Click on the map to set the center of the circle.</h4>
			<h4>Center:</h4>
			<!--			<v-row v-show="previewStore.points[0]">-->
			<!--				<v-col-->
			<!--					cols="2.5"-->
			<!--					xs="3"-->
			<!--					class="field-floating-details"-->
			<!--				>-->
			<!--					<v-text-field-->
			<!--						:model-value="lla.lat"-->
			<!--						label="Latitude"-->
			<!--						readonly-->
			<!--					/>-->
			<!--				</v-col>-->
			<!--				<v-col-->
			<!--					cols="2.5"-->
			<!--					xs="3"-->
			<!--					class="field-floating-details"-->
			<!--				>-->
			<!--					<v-text-field-->
			<!--						v-model.number="lla.lon"-->
			<!--						type="number"-->
			<!--						label="Longitude"-->
			<!--						placeholder="0.0"-->
			<!--						hint="-180 to 180"-->
			<!--						:rules="[(v) => (v >= -180 && v <= 180) || 'Must be -180 to 180']"-->
			<!--						disabled-->
			<!--					/>-->
			<!--				</v-col>-->
			<!--				<v-col-->
			<!--					cols="2.5"-->
			<!--					xs="3"-->
			<!--					class="field-floating-details"-->
			<!--				>-->
			<!--					<v-text-field-->
			<!--						v-model.number="lla.alt"-->
			<!--						type="number"-->
			<!--						label="Altitude"-->
			<!--						placeholder="0.0"-->
			<!--						hide-details-->
			<!--						disabled-->
			<!--					/>-->
			<!--				</v-col>-->
			<!--				<v-col xs="12">-->
			<!--					<v-btn-->
			<!--						block-->
			<!--						color="primary"-->
			<!--						variant="tonal"-->
			<!--						@click="submitCenter"-->
			<!--						:disabled="!previewStore.points[0]"-->
			<!--					>-->
			<!--						Add-->
			<!--					</v-btn>-->
			<!--				</v-col>-->
			<!--			</v-row>-->
			<h4 class="mt-0">2. Click on the map to set the radius of the circle.</h4>
			<h4>Radius:</h4>
			<!--			<v-text-field-->
			<!--				v-model.number="previewStore.radius"-->
			<!--				type="number"-->
			<!--				label="Radius"-->
			<!--				placeholder="0.0"-->
			<!--			/>-->

			<template #next>
				<v-btn
					color="primary"
					@click="changeStep(1)"
					:disabled="!previewStore.radius"
					>Next</v-btn
				>
			</template>
			<template #prev></template>
		</v-stepper-vertical-item>
		<v-stepper-vertical-item
			title="Customize Circle"
			value="2"
			:complete="step > 2"
		>
			<GeoOverlayCustomize
				defaultName="New Circle"
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
