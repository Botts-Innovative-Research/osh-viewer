<script lang="ts" setup>
const show = defineModel<boolean>({ required: true });

const props = defineProps<{
  missionSource: 'waypoints' | 'file' | 'saved';
  waypointCount: number;
  cruiseSpeed: number;
  vehicleType: string;
  waypointAltitude: number;
  isRover: boolean;
  totalDistance: number;
  estimatedTime: number;
  selectedFileName?: string;
}>();

const emit = defineEmits<{
  send: [];
}>();

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
  <v-dialog
      v-model="show"
      max-width="500"
  >
    <v-card>
      <v-card-title>Mission Summary</v-card-title>
      <v-card-text>
        <v-table density="compact">
          <tbody>
            <tr>
              <td class="font-weight-medium">Source</td>
              <td>
                {{ missionSource === 'waypoints' ? 'Waypoints' : 'Plan File' }}
              </td>
            </tr>
            <tr v-if="missionSource === 'waypoints'">
              <td class="font-weight-medium">Waypoints</td>
              <td>{{ waypointCount }}</td>
            </tr>
            <tr v-if="missionSource === 'waypoints'">
              <td class="font-weight-medium">
                {{ isRover ? 'Ground Speed' : 'Speed' }}
              </td>
              <td>{{ cruiseSpeed }} m/s</td>
            </tr>
            <tr v-if="missionSource === 'waypoints'">
              <td class="font-weight-medium">Vehicle Type</td>
              <td>{{ vehicleType }}</td>
            </tr>
            <tr v-if="missionSource === 'waypoints' && !isRover">
              <td class="font-weight-medium">Altitude</td>
              <td>{{ waypointAltitude }} m</td>
            </tr>
            <tr v-if="missionSource === 'waypoints' && waypointCount >= 2">
              <td class="font-weight-medium">Total Distance</td>
              <td>{{ formatDistance(totalDistance) }}</td>
            </tr>
            <tr v-if="missionSource === 'waypoints' && waypointCount >= 2">
              <td class="font-weight-medium">Est. Time</td>
              <td>{{ formatTime(estimatedTime) }}</td>
            </tr>
            <tr v-if="missionSource === 'file' && selectedFileName">
              <td class="font-weight-medium">File</td>
              <td>{{ selectedFileName }}</td>
            </tr>
          </tbody>
        </v-table>
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
