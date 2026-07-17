<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
// @ts-ignore
import {randomUUID} from 'osh-js/source/core/utils/Utils.js';
import {VueDraggable} from 'vue-draggable-plus';
import type {Waypoint} from './types';
import MapPointEditor from "@/components/ui/MapPointEditor.vue";
import DeleteButton from "@/components/ui/DeleteButton.vue";
import {useMapStore} from "@/stores/mapstore";
import {useMapInteractionStore} from "@/stores/mapinteractionstore";
import type {MapPoint} from "@/modules/map/types";

const props = defineProps<{
  noController: boolean;
  isSelected: boolean;
  homeLocation: { lat: number; lon: number; alt: number };
  vehicleType: string;
}>();

const emit = defineEmits<{
	toggle: [];
	clearWaypoints: [];
	setHome: [location: { lat: number; lon: number }];
}>();

const waypoints = defineModel<Waypoint[]>('waypoints', { required: true });
const waypointAltitude = defineModel<number>('waypointAltitude', { required: true });
const cruiseSpeed = defineModel<number>('cruiseSpeed', { required: true });
const hoverSpeed = defineModel<number>('hoverSpeed', { required: true });
const altitudeMode = defineModel<number>('altitudeMode', { required: true });
const editorPoint = ref<MapPoint>({ lat: 0, lon: 0, alt: 0 });
const showClearConfirm = ref(false);

const altitudeModeOptions = [
  { title: 'Relative', value: 0},
  { title: 'AMSL - Above Mean Sea Level', value: 1 },
  { title: 'Above Terrain / AGL', value: 2 },
  // { title: 'Mixed Modes', value: 3 },
];
const isGroundVehicle = computed(() => props.vehicleType === 'Ground Rover' || props.vehicleType === 'Surface Boat');

function addWaypointFromMap(payload: MapPoint) {
  const newWaypoint: Waypoint = {
    id: randomUUID(),
    lat: payload.lat,
    lon: payload.lon,
    alt: isGroundVehicle.value ? 0 : payload.alt,
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
      }
    }
);

function toggleHomeLocationSelect() {
  mapInteractionStore.toggleTool('homeLocation');
}

defineExpose({ setLatLonAlt });
</script>

<template>
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

  <div class="d-flex justify-space-between align-center mb-2" v-if="waypoints.length > 0">
    <span class="text-subtitle-2">Waypoints</span>
    <v-btn
        :disabled="waypoints.length === 0"
        color="error"
        size="small"
        variant="text"
        @click="showClearConfirm = true"
    >
      Clear current mission
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
          <v-spacer/>
          <v-btn
              variant="text"
              @click="showClearConfirm = false"
          >Cancel
          </v-btn>
          <v-btn
              color="error"
              variant="flat"
              @click="clearAll"
          >Clear
          </v-btn>
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
          >mdi-drag
          </v-icon>
          <span class="text-caption w-auto">{{ index + 1 }}.</span>
        </div>
      </template>
      <v-list-item-title class="px-2">
        <v-row
            class="align-center"
            density="compact"
        >
          <v-col :cols="isGroundVehicle ? 6 : 4">
            <v-text-field
                v-model.number="wp.lat"
                density="compact"
                hide-details
                label="Lat"
                type="number"
            />
          </v-col>
          <v-col :cols="isGroundVehicle ? 6 : 4">
            <v-text-field
                v-model.number="wp.lon"
                density="compact"
                hide-details
                label="Lon"
                type="number"
            />
          </v-col>
          <v-col
              v-if="!isGroundVehicle"
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
        <DeleteButton
            label="Remove"
            @delete="removeWaypoint(wp.id)"
        ></DeleteButton>
      </template>
    </v-list-item>
  </VueDraggable>
  <div
      v-else
      class="text-caption text-grey text-center pa-4"
  >
    No waypoints added. Click on the map or use the form above.
  </div>

  <v-divider class="mt-4 mb-3" />

  <v-row density="comfortable">
    <v-btn
        block
        :color="isHomeLocationMapSelect ? 'primary' : 'grey'"
        variant="tonal"
        @click="toggleHomeLocationSelect"
        prepend-icon="mdi-home-map-marker"
    >
      {{ isHomeLocationMapSelect ? 'Click map to set home...' : 'Set Home Waypoint' }}
      <v-tooltip activator="parent" location="top">
        Click to select a home position from the map.
      </v-tooltip>
    </v-btn>
  </v-row>

  <v-row density="comfortable" class="mt-4">
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

<style scoped>
.waypoints-list {
	max-height: 175px;
	overflow-y: auto;
}
.drag-handle {
	cursor: grab;
}
.drag-handle:active {
	cursor: grabbing;
}
</style>
