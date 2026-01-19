<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { SweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { computed, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useUIStore } from '@/stores/uistore';
import { sendCommand } from '@/lib/ControlstreamUtils';

const flightPathId = ref('flightPath-' + randomUUID());

const props = defineProps({
  visualization: {
    type: OSHVisualization,
    required: false,
    default: null,
  },
  datasource: {
    type: SweApiDataSourceProperties,
    required: true,
    default: null,
  },
  controlstream: {
    type: Object,
    required: true,
    default: null,
  }
});

interface Waypoint {
  id: string;
  lat: number;
  lon: number;
  alt: number;
}

const waypoints = ref<Waypoint[]>([]);

const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(0.0);

const uiStore = useUIStore();
const isSelected = ref(false);

const commandBaseUrl = computed(() => {
  const protocol = props.controlstream.tls ? 'https' : 'http';
  return `${protocol}://${props.controlstream.endpointUrl}`;
});

const csAuth = computed(() => {
  return {username: props.controlstream.connectorOpts.username, password: props.controlstream.connectorOpts.password}
});

watch(
    () => uiStore.selectedFlightPath,
    (newVal) => {
      if (newVal?.controlStreamId === props.controlstream.id) {
        console.log('[FlightPathView] This flightpath instance is selected:', newVal?.controlStreamId);
        isSelected.value = true;
      } else {
        console.log('[FlightPathView] This instance is NOT selected:', newVal?.controlStreamId);
        isSelected.value = false;
      }
    }
);

watch(
    () => uiStore.currentLLA,
    (newVal) => {
      if (isSelected.value && newVal) {
        latInput.value = newVal.latitude;
        lonInput.value = newVal.longitude;
        altInput.value = newVal.altitude;
        addWaypoint();
      }
    }
);

function toggle() {
  if (isSelected.value) {
    uiStore.clearSelectedFlightPath();
  } else {
    uiStore.setSelectedFlightPath(props.controlstream.id, commandBaseUrl.value, `${csAuth.value.username}:${csAuth.value.password}`);
  }
}

function addWaypoint() {
  const newWaypoint: Waypoint = {
    id: randomUUID(),
    lat: latInput.value,
    lon: lonInput.value,
    alt: altInput.value,
  };
  waypoints.value.push(newWaypoint);
  console.log('[FlightPathView] Added waypoint:', newWaypoint);
}

function removeWaypoint(id: string) {
  waypoints.value = waypoints.value.filter(wp => wp.id !== id);
  console.log('[FlightPathView] Removed waypoint:', id);
}

function clearWaypoints() {
  waypoints.value = [];
  uiStore.clearFlightPathWaypoints();
  uiStore.triggerClearFlightPathMarkers();
  console.log('[FlightPathView] Cleared all waypoints');
}

watch(waypoints, (newWaypoints) => {
  uiStore.setFlightPathWaypoints(newWaypoints.map(wp => ({
    lat: wp.lat,
    lon: wp.lon,
    alt: wp.alt,
  })));
}, { deep: true });

function onSend() {
  const command = {
    parameters: {
      numWaypoints: waypoints.value.length,
      flightPathArray: waypoints.value.map(wp => ({
        lat: wp.lat,
        lon: wp.lon,
        alt: wp.alt,
      })),
    },
  };8

  console.log('[FlightPathView] Sending FlightPath command:', command);
  sendCommand(commandBaseUrl.value, props.controlstream.id, command, `${csAuth.value.username}:${csAuth.value.password}`);
}
</script>

<template>
  <v-card :id="flightPathId" class="pa-4">
    <v-card-title>{{ visualization.name }}</v-card-title>
    <v-container>
      <v-row align="center">
        <v-col cols="auto" align="center">
          <v-btn icon :color="isSelected ? 'primary' : 'grey'" @click="toggle">
            <v-icon>{{ isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs' }}</v-icon>
          </v-btn>
          <div class="text-caption mt-1">{{ isSelected ? 'Click Map' : 'Select' }}</div>
        </v-col>
        <v-col>
          <v-row dense>
            <v-col cols="4">
              <v-text-field v-model.number="latInput" type="number" label="Lat" density="compact" hide-details />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="lonInput" type="number" label="Lon" density="compact" hide-details />
            </v-col>
            <v-col cols="4">
              <v-text-field v-model.number="altInput" type="number" label="Alt" density="compact" hide-details />
            </v-col>
          </v-row>
          <v-row dense class="mt-2">
            <v-col>
              <v-btn size="small" color="secondary" @click="addWaypoint" prepend-icon="mdi-plus">Add Point</v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-divider class="my-3"></v-divider>

      <v-row>
        <v-col>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-subtitle-2">Waypoints ({{ waypoints.length }})</span>
            <v-btn size="x-small" variant="text" color="error" @click="clearWaypoints" :disabled="waypoints.length === 0">
              Clear All
            </v-btn>
          </div>
          <v-list density="compact" v-if="waypoints.length > 0" class="waypoints-list">
            <v-list-item v-for="(wp, index) in waypoints" :key="wp.id" class="pa-1">
              <template v-slot:prepend>
                <span class="text-caption mr-2">{{ index + 1 }}.</span>
              </template>
              <v-list-item-title class="text-body-2">
                {{ wp.lat.toFixed(5) }}, {{ wp.lon.toFixed(5) }}, {{ wp.alt.toFixed(1) }}m
              </v-list-item-title>
              <template v-slot:append>
                <v-btn icon size="x-small" variant="text" @click="removeWaypoint(wp.id)">
                  <v-icon size="small">mdi-close</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-caption text-grey text-center pa-4">
            No waypoints added. Click on the map or use Add Point.
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col>
          <v-btn color="primary" block @click="onSend" :disabled="waypoints.length === 0" prepend-icon="mdi-send">
            Send Flight Path
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style scoped>
.waypoints-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 4px;
}
</style>