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

const TYPE: GeoOverlayType = 'Circle';

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
			<MapPointEditor
				v-model="lla"
				:isSelected="mapInteractionStore.isGeoOverlayCircleSelected"
				:isSelectorDisabled="false"
				:hasSubmit="false"
				@toggle="toggleTool"
				class="pb-4"
			></MapPointEditor>
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
