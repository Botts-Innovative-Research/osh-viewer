<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import type { Waypoint } from './types';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import MapPointCollectionEditor from '@/components/ui/MapPointCollectionEditor.vue';
import { useMapStore } from '@/stores/mapstore';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import type { MapPoint } from '@/modules/map/types';
import { useMissionStore } from '@/stores/missionstore';

const missionStore = useMissionStore();
const props = defineProps<{
	systemId: string;
	noController: boolean;
	isSelected: boolean;
	homeLocation: { lat: number; lon: number; alt: number };
}>();

const emit = defineEmits<{
	toggle: [];
	clearWaypoints: [];
	setHome: [location: { lat: number; lon: number }];
}>();

const waypoints = defineModel<Waypoint[]>('waypoints', { required: true });
const vehicleType = defineModel<string>('vehicleType', { required: true });
const cruiseSpeed = defineModel<number>('cruiseSpeed', { required: true });
const hoverSpeed = defineModel<number>('hoverSpeed', { required: true });
const altitudeMode = defineModel<number>('altitudeMode', { required: true });
const editorPoint = ref<MapPoint>({ lat: 0, lon: 0, alt: 0 });
const isMissionVisible = computed(
	() => !missionStore.hiddenMissionWaypoints.includes(props.systemId)
);
function toggleMissionVisible() {
	if (isMissionVisible.value) missionStore.hideMissionWaypoints(props.systemId);
	else missionStore.showMissionWaypoints(props.systemId);
}

const altitudeModeOptions = [
	{ title: 'Relative', value: 0 },
	{ title: 'AMSL - Above Mean Sea Level', value: 1 },
	{ title: 'Above Terrain / AGL', value: 2 },
	// { title: 'Mixed Modes', value: 3 },
];
const vehicleTypes = ['UAV', 'Ground Rover', 'Submarine', 'Surface Boat'];

const isGroundVehicle = computed(
	() => vehicleType.value === 'Ground Rover' || vehicleType.value === 'Surface Boat'
);

function addWaypointFromMap(payload: MapPoint) {
	const newWaypoint: Waypoint = {
		id: randomUUID(),
		lat: payload.lat,
		lon: payload.lon,
		alt: isGroundVehicle.value ? 0 : payload.alt,
	};
	waypoints.value.push(newWaypoint);
}

watch(
	() => waypoints.value.length,
	(newLen, oldLen) => {
		if (newLen === 0 && oldLen > 0) {
			emit('clearWaypoints');
		}
	}
);

function setLatLonAlt(lat: number, lon: number, alt: number) {
	editorPoint.value = { lat, lon, alt };
	addWaypointFromMap({ lat, lon, alt });
}

const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();

const isHomeLocationMapSelect = computed(() => mapInteractionStore.isHomeLocationSelected);

watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isHomeLocationMapSelect.value && newVal) {
			emit('setHome', { lat: newVal.latitude, lon: newVal.longitude });
			homeEditorPoint.value = {
				lat: newVal.latitude,
				lon: newVal.longitude,
				alt: newVal.altitude,
			};
		}
	}
);

function toggleHomeLocationSelect() {
	mapInteractionStore.toggleTool('homeLocation');
}

defineExpose({ setLatLonAlt });

const homeEditorPoint = ref<MapPoint>({
	lat: props.homeLocation.lat,
	lon: props.homeLocation.lon,
	alt: props.homeLocation.alt,
});
function setHomeFromEditor(point: MapPoint) {
	emit('setHome', {
		lat: point.lat,
		lon: point.lon,
	});
	// Set mission store location to rebuild pm on map
	missionStore.homeLocation = {
		lat: point.lat,
		lon: point.lon,
		alt: point.alt,
	};
}
watch(
	() => props.homeLocation,
	(newVal) => {
		homeEditorPoint.value = {
			lat: newVal.lat,
			lon: newVal.lon,
			alt: newVal.alt,
		};
	},
	{ deep: true }
);
</script>

<template>
	<div class="d-flex align-center ga-2 mb-5">
		<v-select
			v-model="vehicleType"
			:items="vehicleTypes"
			hide-details
			density="compact"
			label="Planning for"
		/>
		<info-tooltip content="Pick the vehicle type for vehicle-specific planning" />
	</div>

	<div class="d-flex align-center ga-2 mb-4">
		<MapPointEditor
			v-model="editorPoint"
			:hide-alt="isGroundVehicle"
			:is-selected="isSelected"
			:is-selector-disabled="noController"
			submit-icon="mdi-plus"
			submit-label="Add"
			@submit="addWaypointFromMap"
			@toggle="emit('toggle')"
		/>
	</div>

	<MapPointCollectionEditor
		v-model="waypoints"
		title="Waypoints"
		:hide-alt="isGroundVehicle"
	>
		<template #visibilityToggle
			><v-tooltip
				text="Toggle Visibility"
				location="bottom"
			>
				<template v-slot:activator="{ props }">
					<IconButton
						v-bind="props"
						aria-label="Toggle Visibility"
						size="small"
						variant="plain"
						:icon="isMissionVisible ? 'mdi-eye' : 'mdi-eye-off'"
						@click.stop="toggleMissionVisible"
					></IconButton>
				</template> </v-tooltip
		></template>
	</MapPointCollectionEditor>

	<v-divider class="mt-4 mb-3" />

	<v-row
		density="comfortable"
		class="mt-4"
	>
		<v-btn
			block
			:color="isHomeLocationMapSelect ? 'primary' : 'grey'"
			variant="tonal"
			@click="toggleHomeLocationSelect"
			:prepend-icon="isHomeLocationMapSelect ? 'mdi-crosshairs-gps' : 'mdi-home-map-marker'"
		>
			{{ isHomeLocationMapSelect ? 'Click map to set home...' : 'Set Home' }}
			<v-tooltip
				activator="parent"
				location="top"
			>
				Click to select a home position from the map.
			</v-tooltip>
		</v-btn>
		<v-expand-transition>
			<v-col
				cols="12"
				v-show="isHomeLocationMapSelect"
			>
				<MapPointEditor
					v-model="homeEditorPoint"
					:hasSelector="false"
					:hasSubmit="true"
					:hideAlt="true"
					submitLabel="Set Home"
					@submit="setHomeFromEditor"
				/>
			</v-col>
		</v-expand-transition>
		<v-col :cols="isGroundVehicle ? 12 : 6">
			<v-text-field
				v-model.number="cruiseSpeed"
				:label="isGroundVehicle ? 'Ground Speed (m/s)' : 'Cruise Speed (m/s)'"
				density="compact"
				hide-details
				type="number"
			/>
		</v-col>
		<v-col
			v-if="!isGroundVehicle"
			cols="6"
		>
			<v-text-field
				v-model.number="hoverSpeed"
				density="compact"
				hide-details
				label="Hover Speed (m/s)"
				type="number"
			/>
		</v-col>
		<v-col
			v-if="!isGroundVehicle"
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
	</v-row>
</template>
