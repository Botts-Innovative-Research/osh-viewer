<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { MapPoint } from '@/modules/map/types';
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		title: string;
		hideAlt?: boolean;
	}>(),
	{
		hideAlt: false,
	}
);
const points = defineModel<MapPoint[]>({
	required: true,
});
const showClearConfirm = ref(false);

function removePoint(index: number) {
	points.value.splice(index, 1);
}
function clearPoints() {
	points.value = [];
	showClearConfirm.value = false;
}
</script>
<template>
	<div class="d-flex justify-space-between align-center mb-4">
		<span class="text-subtitle-2">{{ props.title }} ({{ points.length }})</span>
		<v-btn
			:disabled="points.length === 0"
			color="error"
			size="small"
			variant="text"
			@click="showClearConfirm = true"
		>
			Clear All
		</v-btn>
		<v-dialog
			v-model="showClearConfirm"
			max-width="400"
		>
			<v-card>
				<v-card-item>
					<v-card-title>Clear All Points</v-card-title>
				</v-card-item>
				<v-card-text>
					Are you sure you want to clear all
					{{ points.length }} points? This action cannot be undone.
				</v-card-text>
				<v-card-actions>
					<v-spacer />
					<v-btn
						variant="text"
						@click="showClearConfirm = false"
						>Cancel</v-btn
					>
					<v-btn
						color="error"
						variant="flat"
						@click="clearPoints()"
						>Clear</v-btn
					>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
	<VueDraggable
		v-if="points.length > 0"
		v-model="points"
		handle=".drag-handle"
	>
		<v-list-item
			v-for="(point, index) in points"
			:key="index"
			class="pa-1"
		>
			<template v-slot:prepend>
				<div>
					<v-icon
						class="drag-handle mr-1"
						size="small"
						>mdi-drag</v-icon
					>
					<span class="text-caption w-auto">{{ index + 1 }}.</span>
				</div>
			</template>
			<v-list-item-title class="px-2">
				<v-row
					class="align-center"
					density="compact"
				>
					<v-col cols="4">
						<v-text-field
							v-model.number="point.lat"
							density="compact"
							hide-details
							label="Lat"
							type="number"
						/>
					</v-col>
					<v-col cols="4">
						<v-text-field
							v-model.number="point.lon"
							density="compact"
							hide-details
							label="Lon"
							type="number"
						/>
					</v-col>
					<v-col
						cols="4"
						v-if="!hideAlt"
					>
						<v-text-field
							v-model.number="point.alt"
							density="compact"
							hide-details
							label="Alt"
							type="number"
						/>
					</v-col>
				</v-row>
			</v-list-item-title>
			<template v-slot:append>
				<div class="">
					<v-btn
						icon
						size="x-small"
						variant="text"
						@click="removePoint(index)"
					>
						<v-icon size="small">mdi-close-circle</v-icon>
						<v-tooltip
							activator="parent"
							location="top"
							>Remove point</v-tooltip
						>
					</v-btn>
				</div>
			</template>
		</v-list-item>
	</VueDraggable>
</template>
