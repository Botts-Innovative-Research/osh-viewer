<script lang="ts" setup>
import { ref } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { VueDraggable } from 'vue-draggable-plus';
import LocationPicker from '@/components/ui/LocationPicker.vue';
import type { Waypoint } from './types';

const props = defineProps<{
	isRover: boolean;
	noController: boolean;
	isSelected: boolean;
	homeLocation: { lat: number; lon: number; alt: number };
}>();

const emit = defineEmits<{
	toggle: [];
	clearWaypoints: [];
}>();

const waypoints = defineModel<Waypoint[]>('waypoints', { required: true });
const waypointAltitude = defineModel<number>('waypointAltitude', { required: true });
const cruiseSpeed = defineModel<number>('cruiseSpeed', { required: true });
const hoverSpeed = defineModel<number>('hoverSpeed', { required: true });
const altitudeMode = defineModel<number>('altitudeMode', { required: true });
const autoContinue = defineModel<boolean>('autoContinue', { required: true });
const amslAltAboveTerrain = defineModel<number | null>('amslAltAboveTerrain', { required: true });

const locationPickerRef = ref<InstanceType<typeof LocationPicker> | null>(null);
const showClearConfirm = ref(false);

const altitudeModeOptions = [{ title: 'AMSL (Above Mean Sea Level)', value: 1 }];

function addWaypoint(payload: { lat: number; lon: number; alt: number }) {
	const newWaypoint: Waypoint = {
		id: randomUUID(),
		lat: payload.lat,
		lon: payload.lon,
		alt: props.isRover ? 0 : payload.alt,
	};
	waypoints.value.push(newWaypoint);
}

function removeWaypoint(id: string) {
	waypoints.value = waypoints.value.filter((wp) => wp.id !== id);
}

function clearAll() {
	waypoints.value = [];
	showClearConfirm.value = false;
	emit('clearWaypoints');
}

function setLatLonAlt(lat: number, lon: number, alt: number) {
	locationPickerRef.value?.setLatLonAltAndSubmit(lat, lon, alt);
}

defineExpose({ setLatLonAlt });
</script>

<template>
	<LocationPicker
		ref="locationPickerRef"
		:default-alt="waypointAltitude"
		:disabled="noController"
		:hide-alt="isRover"
		:is-selected="isSelected"
		button-icon="mdi-plus"
		button-label="Add"
		@submit="addWaypoint"
		@toggle="emit('toggle')"
	/>

	<v-expansion-panels class="mt-3">
		<v-expansion-panel title="Waypoint Settings">
			<v-expansion-panel-text>
				<div class="d-flex justify-space-between align-center mb-4">
					<span class="text-subtitle-2">Waypoints ({{ waypoints.length }})</span>
					<v-btn
						:disabled="waypoints.length === 0"
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
								<v-card-title>Clear All Waypoints</v-card-title>
							</v-card-item>
							<v-card-text>
								Are you sure you want to clear all
								{{ waypoints.length }} waypoints? This action cannot be undone.
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
									@click="clearAll"
									>Clear</v-btn
								>
							</v-card-actions>
						</v-card>
					</v-dialog>
				</div>
				<VueDraggable
					v-if="waypoints.length > 0"
					v-model="waypoints"
					:animation="150"
					class="waypoints-list"
					handle=".drag-handle"
				>
					<v-list-item
						v-for="(wp, index) in waypoints"
						:key="wp.id"
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
								<v-col :cols="isRover ? 6 : 4">
									<v-text-field
										v-model.number="wp.lat"
										density="compact"
										hide-details
										label="Lat"
										type="number"
									/>
								</v-col>
								<v-col :cols="isRover ? 6 : 4">
									<v-text-field
										v-model.number="wp.lon"
										density="compact"
										hide-details
										label="Lon"
										type="number"
									/>
								</v-col>
								<v-col
									v-if="!isRover"
									cols="4"
								>
									<v-text-field
										v-model.number="wp.alt"
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
									@click="removeWaypoint(wp.id)"
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
				<div
					v-else
					class="text-caption text-grey text-center pa-4"
				>
					No waypoints added. Click on the map or use the form above.
				</div>
				<v-divider class="my-4"></v-divider>
				<v-row density="comfortable">
					<v-col
						v-if="!isRover"
						cols="12"
						md="6"
					>
						<v-text-field
							v-model.number="waypointAltitude"
							density="compact"
							hide-details
							label="Altitude (m)"
							type="number"
						/>
					</v-col>
					<v-col
						v-if="!isRover"
						cols="12"
						md="6"
					>
						<v-text-field
							v-model.number="amslAltAboveTerrain"
							clearable
							density="compact"
							hide-details
							label="AMSL Alt Above Terrain"
							type="number"
						/>
					</v-col>
					<v-col
						v-if="!isRover"
						cols="12"
						md="6"
					>
						<v-select
							v-model="altitudeMode"
							:items="altitudeModeOptions"
							density="compact"
							hide-details
							label="Altitude Mode"
						/>
					</v-col>
					<v-col
						cols="12"
						md="6"
					>
						<v-checkbox
							v-model="autoContinue"
							color="primary"
							density="compact"
							hide-details
							label="Auto Continue"
						/>
					</v-col>
				</v-row>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel title="Planned Home Position">
			<v-expansion-panel-text class="py-2">
				<v-row density="comfortable">
					<v-col :cols="isRover ? 6 : 4">
						<v-card-subtitle>Latitude</v-card-subtitle>
						<v-card-text>{{ homeLocation.lat.toFixed(6) }}</v-card-text>
					</v-col>
					<v-col :cols="isRover ? 6 : 4">
						<v-card-subtitle>Longitude</v-card-subtitle>
						<v-card-text>{{ homeLocation.lon.toFixed(6) }}</v-card-text>
					</v-col>
					<v-col
						v-if="!isRover"
						cols="4"
					>
						<v-card-subtitle>Altitude</v-card-subtitle>
						<v-card-text>{{ homeLocation.alt.toFixed(2) }}</v-card-text>
					</v-col>
				</v-row>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel title="Mission Settings">
			<v-expansion-panel-text class="py-2">
				<v-row density="comfortable">
					<v-col :cols="isRover ? 12 : 6">
						<v-text-field
							v-model.number="cruiseSpeed"
							:label="isRover ? 'Ground Speed (m/s)' : 'Cruise Speed'"
							density="compact"
							hide-details
							type="number"
						/>
					</v-col>
					<v-col
						v-if="!isRover"
						cols="6"
					>
						<v-text-field
							v-model.number="hoverSpeed"
							clearable
							density="compact"
							hide-details
							label="Hover Speed"
							type="number"
						/>
					</v-col>
				</v-row>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel title="GeoFence Settings">
			<v-expansion-panel-text>
				<v-label>Not implemented yet</v-label>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel title="Rally Points Settings">
			<v-expansion-panel-text>
				<v-label>Not implemented yet</v-label>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>

<style scoped>
.waypoints-list {
	max-height: 125px;
	overflow-y: auto;
}
.drag-handle {
	cursor: grab;
}
.drag-handle:active {
	cursor: grabbing;
}
</style>
