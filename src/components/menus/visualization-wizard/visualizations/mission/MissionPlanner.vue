<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { SweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import {computed, onMounted, ref, watch} from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useUIStore } from '@/stores/uistore';
import { sendCommand } from '@/lib/ControlstreamUtils';
import {showToast} from "@/composables/useToast";
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';

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

interface LLAData {
  lat: number;
  lon: number;
  alt: number;
}

const missionSource = ref<'waypoints' | 'file'>('waypoints')

const receivedLLA = ref<LLAData>({ lat: 0, lon: 0, alt: 0 });

const hasReceivedFirstLLA = ref(false)

const waypoints = ref<Waypoint[]>([]);

const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(0.0);

const uiStore = useUIStore();
const isSelected = ref(false);
const fileInputRef = ref<any | null>(null);
const selectedFile = ref<File | null>(null);

const droneDatasource = ref<any>(null);


const commandBaseUrl = computed(() => {
  const protocol = props.controlstream.tls ? 'https' : 'http';
  return `${protocol}://${props.controlstream.endpointUrl}`;
});

const csAuth = computed(() => {
  return {username: props.controlstream.connectorOpts.username, password: props.controlstream.connectorOpts.password}
});

watch(() => uiStore.selectedFlightPath, (newVal) => {
    if (newVal?.controlStreamId === props.controlstream.id) {
      isSelected.value = true;
    } else {
      isSelected.value = false;
    }
});

watch(() => uiStore.currentLLA, (newVal) => {
  if (isSelected.value && newVal) {
    latInput.value = newVal.latitude;
    lonInput.value = newVal.longitude;
    altInput.value = newVal.altitude;
    addWaypoint();
  }
});

watch(missionSource, (source) => {
  if (source === 'waypoints') {
    selectedFile.value = null;
  }
  if (source === 'file') {
    clearWaypoints()
  }
});


function toggle() {
  if (isSelected.value) {
    uiStore.clearSelectedFlightPath();
  } else {
    uiStore.setSelectedFlightPath(props.controlstream.id, commandBaseUrl.value, `${csAuth.value.username}:${csAuth.value.password}`);
  }
}

function addWaypoint() {
  missionSource.value = 'waypoints'
  const newWaypoint: Waypoint = {
    id: randomUUID(),
    lat: latInput.value,
    lon: lonInput.value,
    alt: altInput.value,
  };
  waypoints.value.push(newWaypoint);
  console.log('[MissionPlanner.vue] Added waypoint:', newWaypoint);
}

function removeWaypoint(id: string) {
  waypoints.value = waypoints.value.filter(wp => wp.id !== id);
  console.log('[MissionPlanner.vue] Removed waypoint:', id);
}

function clearWaypoints() {
  waypoints.value = [];
  uiStore.clearFlightPathWaypoints();
  uiStore.triggerClearFlightPathMarkers();
  console.log('[MissionPlanner.vue] Cleared all waypoints');
}

watch(waypoints, (newWaypoints) => {
  uiStore.setFlightPathWaypoints(newWaypoints.map(wp => ({
    lat: wp.lat,
    lon: wp.lon,
    alt: wp.alt,
  })));
}, { deep: true });

function sendMission() {
  if (missionSource.value === 'waypoints')
    sendWaypoints()

  if (missionSource.value === 'file')
    sendFileUpload()
}

function sendWaypoints() {
  const plan = generateQGroundControlPlan();

  if (!plan) {
    showToast("Cannot send empty flight plan", 'ERROR');
  }


  const command = {
    parameters: {
      qGroundControlPlan: JSON.stringify(plan)
    }
  };

  console.log('[MissionPlanner.vue] Sending MissionPlanner command:', command);
  sendCommand(
      commandBaseUrl.value,
      props.controlstream.id,
      command,
      `${csAuth.value.username}:${csAuth.value.password}`
  );

}

function sendFileUpload() {
  if (!selectedFile.value) {
    console.warn('[MissionPlanner.vue] No file selected')
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const fileContent = reader.result as string;

    const command = {
      parameters: {
        qGroundControlPlan: fileContent
      }
    }

    console.log('[MissionPlanner.vue] Sending mission file command:', command);
    sendCommand(
        commandBaseUrl.value,
        props.controlstream.id,
        command,
        `${csAuth.value.username}:${csAuth.value.password}`
    );
  }
  reader.onerror = (e) => {
    console.error('[MissionPlanner.vue] File reader error:', e);
  }

  reader.readAsText(selectedFile.value);
}

function cancelMission() {
  // will add support later
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    return;
  }

  selectedFile.value = input.files[0];
  missionSource.value = 'file'
  input.value = '';
}

const triggerFileInput = () => {
  fileInputRef.value?.click();
}

function clearSelectedFile() {
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

let initialDroneLocation = ref<{ lat: number; lon: number; alt: number } | null>(null);

function generateQGroundControlPlan() {
  if (waypoints.value.length === 0) {
    console.warn("[MissionPlanner.vue] No waypoints to generate plan");
    return null;
  }


  const plannedHomePosition = [
    initialDroneLocation.value?.lat ?? waypoints.value[0].lat,
    initialDroneLocation.value?.lon ?? waypoints.value[0].lon,
    initialDroneLocation.value?.alt ?? waypoints.value[0].alt,
  ]


  // send takeoff
  const takeoffLocation = initialDroneLocation.value ?? waypoints.value[0];

  const items: any[] = [{
    AMSLAltAboveTerrain: null,
    Altitude: 50,
    AltitudeMode: 1,
    autoContinue: true,
    command: 22, // 22 = takeoff
    doJumpId: 1,
    frame: 3,
    params: [
      0,
      0,
      0,
      null,
      takeoffLocation.lat,
      takeoffLocation.lon,
      takeoffLocation.alt,
    ],
    type: "SimpleItem"
  }];

  waypoints.value.forEach((wp, index) => {
    items.push({
      AMSLAltAboveTerrain: null,
      Altitude: 50,
      AltitudeMode: 1,
      autoContinue: true,
      command: 16, // 16 = waypoint
      doJumpId: index + 2,
      frame: 3,
      params: [
        0,
        0,
        0,
        null,
        wp.lat,
        wp.lon,
        wp.alt,
      ],
      type: "SimpleItem"
    });
  });

  items.push({
    AMSLAltAboveTerrain: null,
    Altitude: 0,
    AltitudeMode: 1,
    autoContinue: true,
    command: 21,
    doJumpId: items.length + 1,
    frame: 3,
    params: [
      0,
      0,
      0,
      null,
      initialDroneLocation.value?.lat ?? waypoints.value[0].lat,
      initialDroneLocation.value?.lon ?? waypoints.value[0].lon,
      0
    ],
    type: "SimpleItem"
  });

  return  {
    fileType: "Plan",
    geoFence: {
      circles: [],
      polygons: [],
      version: 2
    },
    groundStation: "QGroundControl",
    mission: {
      cruiseSpeed: 15,
      firmwareType: 3,
      globalPlanAltitudeMode: 0,
      hoverSpeed: 5,
      items: items,
      plannedHomePosition: plannedHomePosition,
      vehicleType: 2,
      version: 2
    },
    rallyPoints: {
      points: [],
      version: 2
    },
    version: 1
  };

}

onMounted(async () => {
  // Create SweApi instance from props.datasource if provided
  let dsInstance: any = null;

  dsInstance = new SweApi('mission-datasource', {
    endpointUrl: props.datasource.endpointUrl,
    resource: props.datasource.resource,
    tls: props.datasource.tls,
    protocol: props.datasource.protocol,
    startTime: props.datasource.startTime,
    endTime: props.datasource.endTime,
    mode: props.datasource.mode,
    responseFormat: props.datasource.responseFormat,
    connectorOpts: {
      username: props.datasource.connectorOpts.username ?? '',
      password: props.datasource.connectorOpts.password ?? '',
    }
  });
  droneDatasource.value = dsInstance;
  console.log('[MissionPlanner] Mission Planner datasource created:', droneDatasource.value);

  dsInstance.connect();

  const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

  dataBroadcastChannel.onmessage = (message) => {
    if (message.data.type === 'data') {
      const data = message.data.values[0].data;
      if (!hasReceivedFirstLLA.value) {
        initialDroneLocation.value = {
          lat: data.Location.lat,
          lon: data.Location.lon,
          alt: data.Location.alt
        };
        hasReceivedFirstLLA.value = true;
      }
      receivedLLA.value = {
        lat: data.Location.lat ?? 0,
        lon: data.Location.lon ?? 0,
        alt: data.Location.alt ?? 0,
      };
    }
  };
});

</script>

<template>
  <v-card :id="flightPathId" class="pa-0">
    <v-card-title>
      {{ visualization.name }}
    </v-card-title>

    <v-container class="pa-4">
      <v-row dense align="center">
        <v-col cols="12" sm="auto">
          <v-btn
              icon
              :color="isSelected ? 'primary' : 'grey'"
              @click="toggle"
          >
            <v-icon>{{ isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs' }}</v-icon>
            <v-tooltip activator="parent" location="top">
              {{ isSelected ? 'Click map to add waypoints' : 'Enable map selection' }}
            </v-tooltip>
          </v-btn>
        </v-col>

        <v-col cols="12" sm="">
          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="latInput"
                  type="number"
                  label="Latitude"
                  density="compact"
                  hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="lonInput"
                  type="number"
                  label="Longitude"
                  density="compact"
                  hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                  v-model.number="altInput"
                  type="number"
                  label="Altitude"
                  density="compact"
                  hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-btn
                  block
                  color="primary"
                  @click="addWaypoint"
                  prepend-icon="mdi-plus"
                  variant="flat"
              >
                Add
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-divider class="my-3"></v-divider>

      <v-row>
        <v-col>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-subtitle-2">Waypoints ({{ waypoints.length }})</span>
            <v-btn
                size="small"
                variant="text"
                color="error"
                @click="clearWaypoints"
                :disabled="waypoints.length === 0"
            >
              Clear All
            </v-btn>
          </div>
          <v-list density="compact" v-if="waypoints.length > 0" class="waypoints-list">
            <v-list-item v-for="(wp, index) in waypoints" :key="wp.id" class="pa-1">
              <template v-slot:prepend>
                <span class="text-caption mr-2">{{ index + 1 }}.</span>
              </template>
              <v-list-item-title class="text-body-2">
                {{ wp.lat.toFixed(5) }}, {{ wp.lon.toFixed(5) }}, {{ wp.alt.toFixed(1) }}
              </v-list-item-title>
              <template v-slot:append>
                <v-btn icon size="x-small" variant="text" @click="removeWaypoint(wp.id)">
                  <v-icon size="small">mdi-close-circle</v-icon>
                  <v-tooltip activator="parent" location="top">Remove waypoint</v-tooltip>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-caption text-grey text-center pa-4">
            No waypoints added. Click on the map or use the form to add waypoints.
          </div>
        </v-col>
      </v-row>

    </v-container>

      <v-container class="pa-4">
        <v-row dense>
          <v-col cols="12">
            <v-btn
                block
                @click="triggerFileInput"
                prepend-icon="mdi-file-upload"
                variant="outlined"
            >
              Browse Files
            </v-btn>
            <input
                type="file"
                ref="fileInputRef"
                style="display: none"
                accept=".plan"
                @change="handleFileChange"
            />
          </v-col>
        </v-row>

        <v-row v-if="selectedFile" dense class="mt-2">
          <v-col cols="12">
            <v-alert
                type="info"
                variant="tonal"
                density="compact"
                closable
                @click:close="clearSelectedFile"
            >
              <template v-slot:prepend>
                <v-icon>mdi-file-document</v-icon>
              </template>
              <span class="font-weight-medium">{{ selectedFile.name }}</span>
            </v-alert>
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
         <v-col cols="12" sm="6">
           <v-btn
               color="primary"
               block
               @click="sendMission"
               :disabled="(missionSource === 'waypoints' && waypoints.length === 0) || (missionSource === 'file' && !selectedFile)"
               prepend-icon="mdi-send"
           >
             Send Mission
           </v-btn>
         </v-col>
          <v-col cols="12" sm="6">
            <v-btn
                color="error"
                block
                @click="cancelMission"
                prepend-icon="mdi-stop-circle"
                variant="outlined"
            >
              Cancel Mission
            </v-btn>
          </v-col>
        </v-row>

      </v-container>

    <v-col>
      <h3>Current LLA</h3>
      <v-row dense>
        <v-col cols="4">
          <p>Lat: {{ receivedLLA.lat.toFixed(6) }}</p>
        </v-col>
        <v-col cols="4">
          <p>Lon: {{ receivedLLA.lon.toFixed(6) }}</p>
        </v-col>
        <v-col cols="4">
          <p>Alt: {{ receivedLLA.alt.toFixed(2) }} MSL</p>
        </v-col>
      </v-row>
    </v-col>
  </v-card>
</template>

<style scoped>
.waypoints-list {
  max-height: 300px;
  overflow-y: auto;

}
</style>
