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
	get: () => previewStore.points[0] ?? { lat: 0, lon: 0, alt: 0 },
	set: (point: MapPoint) => (previewStore.points[0] = point),
});
// Set default value of input to 0 when none given
function defaultToZero(key: keyof MapPoint) {
	const value = lla.value[key] as number | '' | null | undefined;
	if (value == null || value === '') {
		lla.value[key] = 0;
	}
}
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
			<v-expand-transition>
				<h4
					class="mt-0"
					v-show="previewStore.circleCreationStep === 'center'"
				>
					1. Click on the map to set the center of the circle.
				</h4>
			</v-expand-transition>
			<v-row class="pb-2">
				<v-col
					cols="2.5"
					xs="3"
				>
					<v-text-field
						:model-value="lla.lat"
						type="number"
						label="Latitude"
						placeholder="0.0"
						hint="-90 to 90"
						min="-90"
						max="90"
						:rules="[(v) => (v >= -90 && v <= 90) || 'Must be -90 to 90']"
						@blur="defaultToZero('lat')"
						:disabled="previewStore.circleCreationStep === 'center'"
					/>
				</v-col>
				<v-col
					cols="2.5"
					xs="3"
				>
					<v-text-field
						v-model.number="lla.lon"
						type="number"
						label="Longitude"
						placeholder="0.0"
						hint="-180 to 180"
						min="-180"
						max="180"
						:rules="[(v) => (v >= -180 && v <= 180) || 'Must be -180 to 180']"
						@blur="defaultToZero('lon')"
						:disabled="previewStore.circleCreationStep === 'center'"
					/>
				</v-col>
				<v-col
					cols="2.5"
					xs="3"
				>
					<v-text-field
						v-model.number="lla.alt"
						type="number"
						label="Altitude"
						placeholder="0.0"
						@blur="defaultToZero('alt')"
						:disabled="previewStore.circleCreationStep === 'center'"
					/>
				</v-col>
			</v-row>
			<v-expand-transition>
				<h4
					class="mt-0"
					v-show="previewStore.circleCreationStep === 'radius'"
				>
					2. Click on the map to set the radius of the circle.
				</h4>
			</v-expand-transition>
			<v-row class="pb-2">
				<v-text-field
					v-model.number="previewStore.radius"
					type="number"
					label="Radius (m)"
					placeholder="1.0"
					hint="Meters (m)"
					min="0"
					:rules="[(v) => v > 0 || 'Must be at greater than 0']"
					:disabled="previewStore.circleCreationStep === 'center'"
				/>
			</v-row>
			<h4
				class="ma-0"
				v-show="previewStore.circleCreationStep === null"
			>
				3. Edit the center/radius or continue.
			</h4>
			<template #next>
				<v-btn
					color="primary"
					@click="changeStep(1)"
					:disabled="
						!(previewStore.circleCreationStep === null) ||
						previewStore.points.length === 0 ||
						!previewStore.radius
					"
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
