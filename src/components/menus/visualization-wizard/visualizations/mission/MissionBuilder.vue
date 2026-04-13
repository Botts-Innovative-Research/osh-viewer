<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { ISweApiControlStreamProperties, ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useUIStore } from '@/stores/uistore';
import { sendCommand } from '@/lib/ControlstreamUtils';
import { showToast } from "@/composables/useToast";
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import {
  createDatasource,
  getLatestObservation,
  useDisconnectDatasources
} from "@/components/menus/visualization-wizard/shared/helpers";
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useDataStreamStore } from "@/stores/datastreamstore";


// python sim_vehicle.py -v ArduCopter -f quad --console --map --location=Taiwan

interface Controlstream {
  id: string;
  endpointUrl: string;
  tls: boolean;
  properties?: Record<string, any>;
  connectorOpts: {
    username: string;
    password: string;
  };
}

const props = defineProps({
  visualization: {
    type: OSHVisualization,
    required: false,
    default: null,
  },
  datasource: {
    type: Array as () => ISweApiDataSourceProperties[],
    required: true,
    default: () => [],
  },
  controlstreams: {
    type: Array as () => ISweApiControlStreamProperties[],
    required: true,
    default: () => [],
  }
});

// Helper to find controlstream by role
function getControlstreamByRole(role: string): Controlstream | undefined {
  return props.controlstreams.find((cs) => cs.properties && cs.properties[role]);
}

// Get the plan controlstream for sending missions
const missionControlStream = computed<Controlstream | undefined>(() => getControlstreamByRole('plan'));
const qgcControlStream = computed<Controlstream | undefined>(() => getControlstreamByRole('qgc'));

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
const waypoints = ref<Waypoint[]>([]);

const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(0.0);
const waypointForm = ref<any>(null);

const uiStore = useUIStore();
const isSelected = ref<boolean>(false);
const fileInputRef = ref<any | null>(null);
const selectedFile = ref<File | null>(null);

const droneDatasourceLLA = ref<SweApi | null>(null);
const droneHomeDatasource = ref<SweApi | null>(null);

let homeLocation = ref<{ lat: number; lon: number; alt: number }>({ lat: 0, lon: 0, alt: 0 });

const cruiseSpeed = ref<number>(15);
const hoverSpeed = ref<number>(5);
const waypointAltitude = ref<number>(25);
const altitudeMode = ref<number>(1);
const autoContinue = ref<boolean>(true);
const amslAltAboveTerrain = ref<number | null>(null);

const altitudeModeOptions = [
  { title: 'AMSL (Above Mean Sea Level)', value: 1 },
];

const commandBaseUrl = computed(() => {
  const cs = missionControlStream.value;
  if (!cs) return '';
  const protocol = cs.tls ? 'https' : 'http';
  return `${protocol}://${cs.endpointUrl}`;
});

const csAuth = computed(() => {
  const cs = missionControlStream.value;
  if (!cs) return { username: '', password: '' };
  return { username: cs.connectorOpts.username, password: cs.connectorOpts.password };
});

watch(() => uiStore.selectedWaypoints, (newVal) => {
  const cs = missionControlStream.value;
  if (cs && newVal?.controlStreamId === cs.id) {
    isSelected.value = true;
  } else {
    isSelected.value = false;
  }
});

watch(() => uiStore.currentLLA, (newVal) => {
  if (isSelected.value && newVal) {
    latInput.value = newVal.latitude;
    lonInput.value = newVal.longitude;
    altInput.value = newVal.altitude > 0 ? newVal.altitude : waypointAltitude.value;
    addWaypoint();
  }
});


function toggle() {
  const cs = missionControlStream.value;
  if (isSelected.value) {
    uiStore.disableWaypointSelection();
  } else if (cs) {
    uiStore.setSelectedWaypoints(cs.id, commandBaseUrl.value, `${csAuth.value.username}:${csAuth.value.password}`);
  }
}

async function addWaypoint() {
  const { valid } = await waypointForm.value.validate();
  if (!valid) return;

  missionSource.value = 'waypoints'
  const newWaypoint: Waypoint = {
    id: randomUUID(),
    lat: latInput.value,
    lon: lonInput.value,
    alt: altInput.value,
  };
  waypoints.value.push(newWaypoint);
  console.log('[MissionBuilder.vue] Added waypoint:', newWaypoint);
}

function removeWaypoint(id: string) {
  waypoints.value = waypoints.value.filter(wp => wp.id !== id);
  console.log('[MissionBuilder.vue] Removed waypoint:', id);
}

function clearWaypoints() {
  waypoints.value = [];
  uiStore.clearMissionWaypoints();
  uiStore.triggerClearWaypointMarkers();
  console.log('[MissionBuilder.vue] Cleared all waypoints');
}

watch(waypoints, (newWaypoints) => {
  uiStore.setFlightPathWaypoints(newWaypoints.map(wp => ({
    lat: wp.lat,
    lon: wp.lon,
    alt: wp.alt
  })));
}, { deep: true });

function sendMission() {
  if (missionSource.value === 'waypoints')
    sendWaypoints()

  if (missionSource.value === 'file')
    sendQGCPlanFileUpload()
}

function sendWaypoints() {
  const plan = generateMissionControlPlan();

  if (!plan) {
    showToast("Cannot send empty mission", 'ERROR');
  }

  const command = {
    parameters: {
      qGroundControlPlan: JSON.stringify(plan)
    }
  };

  const cs = missionControlStream.value;
  if (!cs) {
    showToast("No mission controlstream configured", 'ERROR');
    return;
  }
  console.log('[MissionBuilder.vue] Sending MissionBuilder command:', command);
  sendCommand(
    commandBaseUrl.value,
    cs.id,
    command,
    `${csAuth.value.username}:${csAuth.value.password}`
  );
}

function sendQGCPlanFileUpload() {
  if (!selectedFile.value) {
    console.warn('[MissionBuilder.vue] No file selected')
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const fileContent = reader.result as string;

    const cs = qgcControlStream.value;
    if (!cs) {
      showToast("No plan controlstream configured", 'ERROR');
      return;
    }

    const command = {
      parameters: {
        qGroundControlPlan: fileContent
      }
    }

    console.log('[MissionBuilder.vue] Sending mission file command:', command, qgcControlStream.value);
    sendCommand(
      commandBaseUrl.value,
      qgcControlStream.value.id,
      command,
      `${csAuth.value.username}:${csAuth.value.password}`
    );
  }
  reader.onerror = (e) => {
    console.error('[MissionBuilder.vue] File reader error:', e);
  }

  reader.readAsText(selectedFile.value);
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

function generateMissionControlPlan() {
  if (waypoints.value.length === 0) {
    console.warn("[MissionBuilder.vue] No waypoints to generate plan");
    return null;
  }

  const plannedHomePosition = [
    homeLocation.value?.lat ?? waypoints.value[0].lat,
    homeLocation.value?.lon ?? waypoints.value[0].lon,
    homeLocation.value?.alt ?? waypoints.value[0].alt,
  ]

  // send takeoff
  const takeoffLocation = homeLocation.value ?? waypoints.value[0];

  const items: any[] = [{
    AMSLAltAboveTerrain: amslAltAboveTerrain.value,
    Altitude: waypointAltitude.value,
    AltitudeMode: altitudeMode.value,
    autoContinue: autoContinue.value,
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
      AMSLAltAboveTerrain: amslAltAboveTerrain.value,
      Altitude: waypointAltitude.value,
      AltitudeMode: altitudeMode.value,
      autoContinue: autoContinue.value,
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
    AMSLAltAboveTerrain: amslAltAboveTerrain.value,
    Altitude: 0,
    AltitudeMode: altitudeMode.value,
    autoContinue: autoContinue.value,
    command: 21,
    doJumpId: items.length + 1,
    frame: 3,
    params: [
      0,
      0,
      0,
      null,
      homeLocation.value?.lat ?? waypoints.value[0].lat,
      homeLocation.value?.lon ?? waypoints.value[0].lon,
      0
    ],
    type: "SimpleItem"
  });

  return {
    fileType: "Plan",
    geoFence: {
      circles: [],
      polygons: [],
      version: 2
    },
    groundStation: "QGroundControl",
    mission: {
      cruiseSpeed: cruiseSpeed.value,
      firmwareType: 3,
      globalPlanAltitudeMode: 0,
      hoverSpeed: hoverSpeed.value,
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


function onLLAListener(dsInstance: SweApi) {
  const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

  dataBroadcastChannel.onmessage = (message) => {
    if (message.data.type === 'data') {
      const data = message.data.values[0].data;
      receivedLLA.value = {
        lat: data.Location.lat ?? 0,
        lon: data.Location.lon ?? 0,
        alt: data.Location.alt ?? 0,
      };
    }
  };
}


onMounted(async () => {
  // Create SweApi instance from props.datasource if provided
  let dsInstances: SweApi[] = [];

  const datastreamStore = useDataStreamStore();

  for (const ds of props.datasource) {
    let dsInstance = createDatasource(ds);
    dsInstance.connect();

    if (ds?.properties?.home) {
      droneHomeDatasource.value = dsInstance;
      console.log('[MissionBuilder] Drone Home datasource created:', droneDatasourceLLA.value);
      let homeLLAResults = await getLatestObservation(ds);
      homeLocation.value = {
        lat: homeLLAResults.result.Home.lat,
        lon: homeLLAResults.result.Home.lon,
        alt: homeLLAResults.result.Home.alt
      }
    } else if (ds?.properties?.lla) {
      droneDatasourceLLA.value = dsInstance;
      console.log('[MissionBuilder] Drone LLA datasource created:', droneDatasourceLLA.value);

      onLLAListener(dsInstance);
    }

    dsInstances.push(dsInstance);
  }
});

onBeforeUnmount(() => {
  if (isSelected.value)
    uiStore.disableWaypointSelection();
  useDisconnectDatasources(droneDatasourceLLA);
  useDisconnectDatasources(droneHomeDatasource);
})

</script>

<template>
  <v-sheet class="pa-0 d-flex flex-column ga-2">
    <v-card class="telemetry-card">
      <v-card-text>Live Telemetry</v-card-text>
      <v-row dense class="">
        <v-col cols="12" md="4">
          <v-card-subtitle>Latitude</v-card-subtitle>
          <v-card-title>{{ receivedLLA.lat.toFixed(6) }}</v-card-title>
        </v-col>
        <v-col cols="12" md="4">
          <v-card-subtitle>Longitude</v-card-subtitle>
          <v-card-title>{{ receivedLLA.lon.toFixed(6) }}</v-card-title>
        </v-col>
        <v-col cols="12" md="4">
          <v-card-subtitle>Altitude</v-card-subtitle>
          <v-card-title>{{ receivedLLA.alt.toFixed(2) }}</v-card-title>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="pa-2">
      <v-tabs v-model="missionSource" grow color="primary" class="mb-2">
        <v-tab value="waypoints" prepend-icon="mdi-map-marker-path">
          <span class="d-none d-sm-inline">Build Mission</span>
          <span class="d-sm-none">Waypoints</span>
        </v-tab>
        <v-tab value="file" prepend-icon="mdi-file-upload">
          <span class="d-none d-sm-inline">Upload Plan</span>
          <span class="d-sm-none">Upload</span>
        </v-tab>
      </v-tabs>

      <v-window v-model="missionSource">
        <v-window-item value="waypoints" class="mt-2">
          <v-form ref="waypointForm">
            <v-row dense cols="12" class="d-flex align-start justify-center">
              <v-col cols="auto" xs="3">
                <IconButton :color="isSelected ? 'primary' : 'grey'" @click="toggle">
                  <v-icon>{{ isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs' }}</v-icon>
                </IconButton>
                <v-tooltip activator="parent" location="top">
                  {{ isSelected ? 'Click map to add waypoints' : 'Enable map selection' }}
                </v-tooltip>
              </v-col>
              <v-col cols="2.3" xs="3">
                <v-text-field v-model.number="latInput" type="number" label="Latitude" placeholder="0.0"
                  hint="-90 to 90" :rules="[v => (v >= -90 && v <= 90) || 'Must be -90 to 90']" />
              </v-col>
              <v-col cols="2.3" xs="3">
                <v-text-field v-model.number="lonInput" type="number" label="Longitude" placeholder="0.0"
                  hint="-180 to 180" :rules="[v => (v >= -180 && v <= 180) || 'Must be -180 to 180']" />
              </v-col>
              <v-col cols="2.3" xs="3">
                <v-text-field v-model.number="altInput" type="number" label="Altitude" placeholder="0.0" hide-details />
              </v-col>
              <v-col xs="12">
                <v-btn block color="primary" @click="addWaypoint" prepend-icon="mdi-plus" variant="flat">
                  Add
                </v-btn>
              </v-col>
            </v-row>
          </v-form>



          <v-expansion-panels class="mt-3">
            <v-expansion-panel title="Waypoint Settings">
              <v-expansion-panel-text>
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-2">Waypoints ({{ waypoints.length }})</span>
                  <v-btn size="small" variant="text" color="error" @click="clearWaypoints"
                    :disabled="waypoints.length === 0">
                    Clear All
                  </v-btn>
                </div>
                <v-list density="compact" v-if="waypoints.length > 0" class="waypoints-list">
                  <v-list-item v-for="(wp, index) in waypoints" :key="wp.id" class="pa-1">
                    <template v-slot:prepend>
                      <span class="text-caption mr-2">{{ index + 1 }}.</span>
                    </template>
                    <v-list-item-title class="text-body-2">
                      <v-row class="align-center">
                        <v-col cols="4">
                          <v-text-field type="number" label="Lat" density="compact" hide-details
                            v-model.number="wp.lat" />
                        </v-col>
                        <v-col cols="4">
                          <v-text-field type="number" label="Lon" density="compact" hide-details
                            v-model.number="wp.lon" />
                        </v-col>
                        <v-col cols="4">
                          <v-text-field type="number" label="Alt" density="compact" hide-details
                            v-model.number="wp.alt" />
                        </v-col>
                      </v-row>
                      <!--                      {{ // wp.lat.toFixed(5) }}, {{ wp.lon.toFixed(5) }}, {{ wp.alt.toFixed(1) }}-->
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
                  No waypoints added. Click on the map or use the form above.
                </div>
              </v-expansion-panel-text>
              <v-expansion-panel-text>
                <v-divider class="my-3"></v-divider>
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.number="waypointAltitude" type="number" label="Altitude (m)" density="compact"
                      hide-details />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.number="amslAltAboveTerrain" type="number" label="AMSL Alt Above Terrain"
                      density="compact" hide-details clearable />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select v-model="altitudeMode" :items="altitudeModeOptions" label="Altitude Mode"
                      density="compact" hide-details />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-checkbox v-model="autoContinue" label="Auto Continue" density="compact" color="primary" />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Planned Home Position">
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <v-card-subtitle>Latitude</v-card-subtitle>
                    <v-card-text>{{ homeLocation.lat.toFixed(6) }}</v-card-text>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card-subtitle>Longitude</v-card-subtitle>
                    <v-card-text>{{ homeLocation.lon.toFixed(6) }}</v-card-text>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-card-subtitle>Altitude</v-card-subtitle>
                    <v-card-text>{{ homeLocation.alt.toFixed(2) }}</v-card-text>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Mission Settings">
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col cols="6" md="3">
                    <v-text-field v-model.number="cruiseSpeed" type="number" label="Cruise Speed" density="compact"
                      hide-details />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-text-field v-model.number="hoverSpeed" type="number" label="Hover Speed" density="compact"
                      hide-details clearable />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

        </v-window-item>

        <v-window-item value="file">
          <v-row dense>
            <v-col cols="12">
              <v-btn block @click="triggerFileInput" prepend-icon="mdi-folder-open" variant="outlined">
                Browse Files
              </v-btn>
              <input type="file" ref="fileInputRef" style="display: none" accept=".plan" @change="handleFileChange" />
            </v-col>
          </v-row>

          <v-row v-if="selectedFile" dense class="mt-3">
            <v-col cols="12">
              <v-alert type="info" variant="tonal" density="compact" closable @click:close="clearSelectedFile">
                <template v-slot:prepend>
                  <v-icon>mdi-file-document</v-icon>
                </template>
                <span class="font-weight-medium">{{ selectedFile.name }}</span>
              </v-alert>
            </v-col>
          </v-row>

          <div v-else class="text-caption text-grey text-center pa-4">
            Select a QGroundControl .plan file to upload.
          </div>
        </v-window-item>
      </v-window>
    </v-card>

    <v-btn color="primary" block @click="sendMission"
      :disabled="(missionSource === 'waypoints' && waypoints.length === 0) || (missionSource === 'file' && !selectedFile)"
      prepend-icon="mdi-send">
      Send Mission
    </v-btn>

    <v-card>
      <MissionCommandPad :controlstreams="controlstreams" class="mt-3" v-if="getControlstreamByRole('land') ||
        getControlstreamByRole('pause') ||
        getControlstreamByRole('rtl') ||
        getControlstreamByRole('offboard') ||
        getControlstreamByRole('takeoff')
" />
    </v-card>

  </v-sheet>
</template>

<style scoped>
.waypoints-list {
  max-height: 125px;
  overflow-y: auto;
}
</style>
