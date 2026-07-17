<script lang="ts" setup>

import {MissionSummary} from "@/modules/visualization/visualizations/mission/types";

const show = defineModel<boolean>({ required: true });

const props = defineProps<{
  missions: MissionSummary[];
}>();

const emit = defineEmits<{
  send: [];
}>();

function isRover(vehicleType: string) {
  return vehicleType === 'Ground Rover' || vehicleType === 'Surface Boat';
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
  return meters.toFixed(1) + ' m';
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
</script>

<template>
  <v-dialog v-model="show" max-width="500">
    <v-card>
      <v-card-title>Mission Summary</v-card-title>
      <v-card-subtitle v-if="missions.length > 1">{{ missions.length }} missions planned</v-card-subtitle>
      <v-card-text>
        <template v-for="(mission, i) in missions" :key="i">
          <div v-if="missions.length > 1" class="d-flex align-center ga-2 mt-2 mb-1">
            <v-icon size="small" :icon="isRover(mission.vehicleType) ? 'mdi-car' : 'mdi-quadcopter'" />
            <span class="text-subtitle-2 font-weight-medium">{{ mission.name }}</span>
          </div>
         <v-table density="compact">
          <tbody>
            <tr>
              <td class="font-weight-medium">Source</td>
              <td>
                {{ mission.missionSource === 'waypoints' ? 'Waypoints' : 'Plan File' }}
              </td>
            </tr>
            <tr v-if="mission.missionSource === 'waypoints'">
              <td class="font-weight-medium">Waypoints</td>
              <td>{{ mission.waypointCount }}</td>
            </tr>
            <tr v-if="mission.missionSource === 'waypoints'">
              <td class="font-weight-medium">
                {{ isRover(mission.vehicleType) ? 'Ground Speed' : 'Speed' }}
              </td>
              <td>{{ mission.cruiseSpeed }} m/s</td>
            </tr>
            <tr v-if="mission.missionSource === 'waypoints'">
              <td class="font-weight-medium">Vehicle Type</td>
              <td>{{ mission.vehicleType }}</td>
            </tr>
            <tr v-if="mission.missionSource === 'waypoints' && !isRover">
              <td class="font-weight-medium">Altitude</td>
              <td>{{ mission.waypointAltitude }} m</td>
            </tr>
            <tr v-if="mission.missionSource === 'waypoints' && mission.waypointCount >= 2">
              <td class="font-weight-medium">Total Distance</td>
              <td>{{ formatDistance(mission.totalDistance) }}</td>
            </tr>
            <tr v-if="mission.missionSource === 'waypoints' && mission.waypointCount >= 2">
              <td class="font-weight-medium">Est. Time</td>
              <td>{{ formatTime(mission.estimatedTime) }}</td>
            </tr>
            <tr v-if="mission.missionSource === 'file' && mission.selectedFileName">
              <td class="font-weight-medium">File</td>
              <td>{{ mission.selectedFileName }}</td>
            </tr>
          </tbody>
        </v-table>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
            variant="text"
            @click="show = false"
        >Cancel</v-btn>
        <v-btn
            color="primary"
            prepend-icon="mdi-send"
            variant="tonal"
            @click="emit('send')"
        >Send</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
