<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { MapPoint } from '@/modules/map/types';

const props = defineProps<{
	showAlt?: boolean;
}>();
const points = defineModel<MapPoint[]>({
	required: true,
});
function removePoint(index: number) {
	points.value.splice(index, 1);
}
function clearPoints() {
	points.value = [];
}
</script>
<template>
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
					<v-col cols="4">
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
							>Remove waypoint</v-tooltip
						>
					</v-btn>
				</div>
			</template>
		</v-list-item>
	</VueDraggable>
</template>
