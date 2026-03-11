<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { onMounted, ref, reactive, computed, onBeforeUnmount } from 'vue';
//@ts-ignore
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource.js';
//@ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
//@ts-ignore
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
//@ts-ignore
import { Mode } from 'osh-js/source/core/datasource/Mode';
import { ISweApiDataSourceProperties } from '@/lib/VisualizationHelpers';
import { showToast } from '@/composables/useToast';

const props = defineProps<{
  visualization: OSHVisualization,
  datasource: ISweApiDataSourceProperties
}>();

const panelId = ref('kerby-rf-' + randomUUID());
const dsInstances = ref<SweApi[]>([]);
const channels = ref<BroadcastChannel[]>([]);
const connectedStreams = ref(0);
const totalStreams = ref(0);

// --- Track which sections have received data ---
const hasData = reactive({
  gps: false, tuner: false, demod: false, bandpower: false,
  positioner: false, platform: false, spectrum: false, systemstatus: false
});

// --- Reactive state for all Kerby data ---
const gps = reactive({ lat: '--', lon: '--', alt: '--', numSats: '--', fix: '--' });
const tuner = reactive({ frequency: '--', bandwidth: '--', gain: '--', attenuation: '--', streamKey: '' });
const demod = reactive({ modulation: '--', squelch: '--', squelchThreshold: '--' });
const bandpower = reactive({ band1: '--', band2: '--', delta: '--' });
const positioner = reactive({ azLocal: '--', elLocal: '--', azEarth: '--', elEarth: '--' });
const platform = reactive({ lat: '--', lon: '--', alt: '--' });
const spectrum = reactive({ nfft: '--', average: '--', binCount: '--', peakPower: '--', meanPower: '--' });
const sysStatus = reactive<Record<string, { value: string, units: string }>>({});

// --- Control form state ---
const tunerForm = reactive({ frequency: null as number | null, bandwidth: null as number | null, gain: null as number | null });
const demodForm = reactive({ modulation: '', squelch: '' as string, squelchThreshold: null as number | null });
const posForm = reactive({ azimuth: null as number | null, elevation: null as number | null, azSpeed: null as number | null, elSpeed: null as number | null });

const hasControls = computed(() => (props.visualization.controlstream?.length ?? 0) > 0);
const hasTunerControl = computed(() => !!findControlStream('tuner'));
const hasDemodControl = computed(() => !!findControlStream('demod'));
const hasPositionerControl = computed(() => !!findControlStream('positioner'));

function fmtNum(val: any, decimals: number): string {
  if (val == null || val === '--' || isNaN(Number(val))) return '--';
  return Number(val).toFixed(decimals);
}

function fmtFreq(hz: any): string {
  if (hz == null || hz === '--' || isNaN(Number(hz))) return '--';
  const v = Number(hz);
  if (v >= 1e9) return (v / 1e9).toFixed(3) + ' GHz';
  if (v >= 1e6) return (v / 1e6).toFixed(3) + ' MHz';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + ' kHz';
  return v + ' Hz';
}

function classifyDatastream(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('gps') || lower.includes('sensor location')) return 'gps';
  // Check demod BEFORE tuner — demod stream names often contain "tuner" too
  if (lower.includes('demod') && !lower.includes('control')) return 'demod';
  if (lower.includes('tuner') && !lower.includes('control')) return 'tuner';
  if (lower.includes('bandpower')) return 'bandpower';
  if (lower.includes('positioner') && lower.includes('orientation')) return 'positioner';
  if (lower.includes('platform')) return 'platform';
  if (lower.includes('system') && lower.includes('status')) return 'systemstatus';
  if (lower.includes('spectrum')) return 'spectrum';
  if (lower.includes('collector')) return 'collector';
  return 'unknown';
}

function handleData(dsName: string, data: any) {
  const type = classifyDatastream(dsName);
  if (type === 'unknown' || type === 'collector') return;

  hasData[type as keyof typeof hasData] = true;

  switch (type) {
    case 'gps':
      gps.lat = fmtNum(data.latitude, 6);
      gps.lon = fmtNum(data.longitude, 6);
      gps.alt = fmtNum(data.altitude, 1);
      gps.numSats = data.numSats ?? '--';
      gps.fix = data.fixValid ? 'Valid' : 'No Fix';
      break;
    case 'tuner':
      tuner.frequency = fmtFreq(data.frequency);
      tuner.bandwidth = fmtFreq(data.bandwidth);
      tuner.gain = fmtNum(data.gain, 1);
      tuner.attenuation = fmtNum(data.attenuation, 1);
      break;
    case 'demod':
      demod.modulation = data.modulation || '--';
      demod.squelch = data.squelch ? 'ON' : 'OFF';
      demod.squelchThreshold = fmtNum(data.squelchThreshold, 2);
      break;
    case 'bandpower':
      bandpower.band1 = fmtNum(data.band1, 2);
      bandpower.band2 = fmtNum(data.band2, 2);
      bandpower.delta = fmtNum(data.delta, 2);
      break;
    case 'positioner':
      positioner.azLocal = fmtNum(data.azimuthLocal, 2);
      positioner.elLocal = fmtNum(data.elevationLocal, 2);
      positioner.azEarth = fmtNum(data.azimuthEarth, 2);
      positioner.elEarth = fmtNum(data.elevationEarth, 2);
      break;
    case 'platform':
      platform.lat = fmtNum(data.latitude, 6);
      platform.lon = fmtNum(data.longitude, 6);
      platform.alt = fmtNum(data.altitude, 1);
      break;
    case 'spectrum':
      spectrum.nfft = data.nfft ?? '--';
      spectrum.average = data.average ?? '--';
      spectrum.binCount = data.binCount ?? '--';
      if (Array.isArray(data.spectrumData) && data.spectrumData.length > 0) {
        const arr = data.spectrumData as number[];
        spectrum.peakPower = fmtNum(Math.max(...arr), 1);
        spectrum.meanPower = fmtNum(arr.reduce((a: number, b: number) => a + b, 0) / arr.length, 1);
      }
      break;
    case 'systemstatus':
      const key = `${data.monitorGroup}/${data.monitorName}`;
      sysStatus[key] = { value: fmtNum(data.currentValue, 1), units: data.units || '' };
      break;
  }
}

// --- Commands (CS API requires application/swe+json, flat fields) ---
function findControlStream(keyword: string) {
  if (!props.visualization.controlstream) return null;
  return props.visualization.controlstream.find(
    cs => cs.name.toLowerCase().includes(keyword)
  ) || null;
}

function getNetworkProps() {
  const ds = props.visualization.datastream?.[0];
  if (!ds) return null;
  return ds.datastream?.networkProperties;
}

function getApiBaseUrl(): string {
  // Use the browser's current location since the CS API is on the same OSH server
  const net = getNetworkProps();
  if (net?.endpointUrl) {
    const protocol = net.tls ? 'https' : 'http';
    const url = `${protocol}://${net.endpointUrl}`;
    console.log('[KerbyRf] API base from networkProperties:', url);
    return url;
  }
  // Fallback: derive from current page URL
  const fallback = `${window.location.protocol}//${window.location.host}/sensorhub/api`;
  console.log('[KerbyRf] API base from window.location:', fallback);
  return fallback;
}

function sendSweCommand(controlStreamId: string, fields: Record<string, any>) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/controlstreams/${controlStreamId}/commands`;

  const net = getNetworkProps();
  const auth = net?.connectorOpts
    ? btoa(`${net.connectorOpts.username}:${net.connectorOpts.password}`)
    : '';

  console.log(`[KerbyRf] Sending SWE command to ${url}:`, fields);

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/swe+json',
      ...(auth && { 'Authorization': `Basic ${auth}` }),
    },
    mode: 'cors',
    body: JSON.stringify(fields),
  })
    .then(async response => {
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      try {
        const data = JSON.parse(text);
        console.log('[KerbyRf] Command result:', data);
        showToast(`Command ${data.statusCode || 'sent'}`, 'SUCCESS');
      } catch {
        // Some commands return empty 200
        showToast('Command sent', 'SUCCESS');
      }
    })
    .catch(error => {
      console.error('[KerbyRf] Command error:', error);
      showToast(`Command failed: ${error.message}`, 'ERROR');
    });
}

function sendTunerCmd() {
  const cs = findControlStream('tuner');
  if (!cs) { showToast('No tuner control stream found', 'ERROR'); return; }

  const cmd: any = {};
  if (tunerForm.frequency != null && tunerForm.frequency > 0) cmd.frequency = tunerForm.frequency;
  if (tunerForm.bandwidth != null && tunerForm.bandwidth > 0) cmd.bandwidth = tunerForm.bandwidth;
  if (tunerForm.gain != null) cmd.gain = tunerForm.gain;

  if (Object.keys(cmd).length === 0) { showToast('No tuner parameters set', 'WARNING'); return; }
  sendSweCommand(cs.id, cmd);
}

function sendDemodCmd() {
  const cs = findControlStream('demod');
  if (!cs) { showToast('No demod control stream found', 'ERROR'); return; }

  const cmd: any = {};
  if (demodForm.modulation) cmd.modulation = demodForm.modulation;
  if (demodForm.squelch !== '') cmd.squelch = demodForm.squelch === 'true';
  if (demodForm.squelchThreshold != null) cmd.squelchThreshold = demodForm.squelchThreshold;

  if (Object.keys(cmd).length === 0) { showToast('No demod parameters set', 'WARNING'); return; }
  sendSweCommand(cs.id, cmd);
}

function sendPositionerCmd() {
  const cs = findControlStream('positioner');
  if (!cs) { showToast('No positioner control stream found', 'ERROR'); return; }

  const cmd: any = { stop: false };
  if (posForm.azimuth != null) cmd.azimuth = posForm.azimuth;
  if (posForm.elevation != null) cmd.elevation = posForm.elevation;
  if (posForm.azSpeed != null) cmd.azimuthSpeed = posForm.azSpeed;
  if (posForm.elSpeed != null) cmd.elevationSpeed = posForm.elSpeed;

  sendSweCommand(cs.id, cmd);
}

function sendEmergencyStop() {
  const cs = findControlStream('positioner');
  if (!cs) { showToast('No positioner control stream found', 'ERROR'); return; }

  sendSweCommand(cs.id, {
    azimuth: 0, elevation: 0, azimuthSpeed: 0, elevationSpeed: 0, stop: true
  });
}

// --- Connect to a single datastream via WebSocket ---
function connectDatastream(oshDs: any) {
  const net = oshDs.datastream?.networkProperties;
  if (!net) {
    console.warn('[KerbyRf] No networkProperties for', oshDs.name);
    return;
  }

  const dsId = oshDs.id;
  const outputName = oshDs.datastream?.properties?.outputName ?? 'result';
  const dsName = oshDs.name || oshDs.datastream?.name || '';

  console.log(`[KerbyRf] Connecting to: ${dsName} (${dsId}), outputName=${outputName}, type=${classifyDatastream(dsName)}`);

  const ds = new SweApi(dsName, {
    endpointUrl: net.endpointUrl,
    resource: `/datastreams/${dsId}/observations`,
    tls: net.tls,
    protocol: 'ws',
    startTime: 'now',
    endTime: '2125-08-01T00:00:00Z',
    mode: Mode.REAL_TIME,
    responseFormat: 'application/swe+json',
    connectorOpts: {
      username: net.connectorOpts?.username ?? '',
      password: net.connectorOpts?.password ?? '',
    },
  });

  dsInstances.value.push(ds);
  ds.connect();
  connectedStreams.value++;

  const channel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + ds.id);
  channels.value.push(channel);

  channel.onmessage = (message: MessageEvent) => {
    if (message.data.type !== 'data') return;
    try {
      const data = message.data.values[0].data;
      handleData(dsName, data);
    } catch (e) {
      console.warn(`[KerbyRf] Error processing data from ${dsName}:`, e);
    }
  };
}

// --- Lifecycle ---
onMounted(async () => {
  if (!props.visualization.datastream || props.visualization.datastream.length === 0) {
    console.warn('[KerbyRf] No datastreams in visualization');
    return;
  }

  totalStreams.value = props.visualization.datastream.length;
  console.log(`[KerbyRf] Connecting to ${totalStreams.value} datastream(s)`);

  // Connect to ALL system datastreams
  for (const oshDs of props.visualization.datastream) {
    const type = classifyDatastream(oshDs.name || '');
    // Skip unknown/collector streams to avoid unnecessary WS connections
    if (type === 'unknown' || type === 'collector') {
      console.log(`[KerbyRf] Skipping ${oshDs.name} (type: ${type})`);
      continue;
    }
    connectDatastream(oshDs);
  }
});

onBeforeUnmount(() => {
  for (const ch of channels.value) ch.close();
  for (const ds of dsInstances.value) ds.disconnect();
});
</script>

<template>
  <v-card :id="panelId" class="kerby-panel">
    <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
      <v-icon start>mdi-antenna</v-icon>
      {{ visualization.name || 'Kerby RF' }}
      <span class="text-caption ml-2 text-medium-emphasis">({{ connectedStreams }}/{{ totalStreams }} streams)</span>
    </v-card-title>

    <v-card-text class="pt-2">
      <v-row dense>
        <!-- Tuner (always show — this is the primary data) -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">Tuner</div>
            <div class="kerby-field"><span>Frequency</span><span class="kerby-val">{{ tuner.frequency }}</span></div>
            <div class="kerby-field"><span>Bandwidth</span><span class="kerby-val">{{ tuner.bandwidth }}</span></div>
            <div class="kerby-field"><span>Gain</span><span class="kerby-val">{{ tuner.gain }} dB</span></div>
            <div class="kerby-field"><span>Attenuation</span><span class="kerby-val">{{ tuner.attenuation }} dB</span></div>
            <template v-if="hasTunerControl">
              <v-divider class="my-1" />
              <div class="text-caption font-weight-bold">Tuner Control</div>
              <v-row dense class="mt-1">
                <v-col cols="4"><v-text-field v-model.number="tunerForm.frequency" label="Freq (Hz)" type="number" density="compact" variant="outlined" hide-details /></v-col>
                <v-col cols="4"><v-text-field v-model.number="tunerForm.bandwidth" label="BW (Hz)" type="number" density="compact" variant="outlined" hide-details /></v-col>
                <v-col cols="4"><v-text-field v-model.number="tunerForm.gain" label="Gain (dB)" type="number" density="compact" variant="outlined" hide-details /></v-col>
              </v-row>
              <v-btn size="small" color="primary" variant="tonal" class="mt-1" @click="sendTunerCmd">Set Tuner</v-btn>
            </template>
          </v-card>
        </v-col>

        <!-- System Status (always show) -->
        <v-col cols="12" md="6">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">System Status</div>
            <template v-if="Object.keys(sysStatus).length > 0">
              <div v-for="(monitor, key) in sysStatus" :key="key" class="kerby-field">
                <span>{{ key }}</span>
                <span class="kerby-val">{{ monitor.value }} {{ monitor.units }}</span>
              </div>
            </template>
            <div v-else class="text-caption text-medium-emphasis">Waiting for data...</div>
          </v-card>
        </v-col>

        <!-- GPS (show only if data received) -->
        <v-col cols="12" md="6" v-if="hasData.gps">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">GPS Position</div>
            <div class="kerby-field"><span>Latitude</span><span class="kerby-val">{{ gps.lat }}</span></div>
            <div class="kerby-field"><span>Longitude</span><span class="kerby-val">{{ gps.lon }}</span></div>
            <div class="kerby-field"><span>Altitude</span><span class="kerby-val">{{ gps.alt }} m</span></div>
            <div class="kerby-field"><span>Satellites</span><span class="kerby-val">{{ gps.numSats }}</span></div>
            <div class="kerby-field"><span>Fix</span><span class="kerby-val">{{ gps.fix }}</span></div>
          </v-card>
        </v-col>

        <!-- Demod (show only if data received) -->
        <v-col cols="12" md="6" v-if="hasData.demod">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">Demodulator</div>
            <div class="kerby-field"><span>Modulation</span><span class="kerby-val">{{ demod.modulation }}</span></div>
            <div class="kerby-field"><span>Squelch</span><span class="kerby-val">{{ demod.squelch }}</span></div>
            <div class="kerby-field"><span>Threshold</span><span class="kerby-val">{{ demod.squelchThreshold }} dB</span></div>
            <template v-if="hasDemodControl">
              <v-divider class="my-1" />
              <div class="text-caption font-weight-bold">Demod Control</div>
              <v-row dense class="mt-1">
                <v-col cols="4">
                  <v-select v-model="demodForm.modulation" :items="['AM','FM','USB','LSB','CW','IQ']" label="Modulation" density="compact" variant="outlined" hide-details clearable />
                </v-col>
                <v-col cols="4">
                  <v-select v-model="demodForm.squelch" :items="[{title:'ON',value:'true'},{title:'OFF',value:'false'}]" label="Squelch" density="compact" variant="outlined" hide-details clearable />
                </v-col>
                <v-col cols="4"><v-text-field v-model.number="demodForm.squelchThreshold" label="Thresh (dB)" type="number" density="compact" variant="outlined" hide-details /></v-col>
              </v-row>
              <v-btn size="small" color="primary" variant="tonal" class="mt-1" @click="sendDemodCmd">Set Demod</v-btn>
            </template>
          </v-card>
        </v-col>

        <!-- Band Power (show only if data received) -->
        <v-col cols="12" md="6" v-if="hasData.bandpower">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">Band Power</div>
            <div class="kerby-field"><span>Band 1</span><span class="kerby-val">{{ bandpower.band1 }} dB</span></div>
            <div class="kerby-field"><span>Band 2</span><span class="kerby-val">{{ bandpower.band2 }} dB</span></div>
            <div class="kerby-field"><span>Delta</span><span class="kerby-val">{{ bandpower.delta }} dB</span></div>
          </v-card>
        </v-col>

        <!-- Spectrum (show only if data received) -->
        <v-col cols="12" v-if="hasData.spectrum">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">Spectrum</div>
            <div class="kerby-field"><span>FFT Size</span><span class="kerby-val">{{ spectrum.nfft }}</span></div>
            <div class="kerby-field"><span>Average</span><span class="kerby-val">{{ spectrum.average }}</span></div>
            <div class="kerby-field"><span>Bins</span><span class="kerby-val">{{ spectrum.binCount }}</span></div>
            <div class="kerby-field"><span>Peak Power</span><span class="kerby-val">{{ spectrum.peakPower }} dB</span></div>
            <div class="kerby-field"><span>Mean Power</span><span class="kerby-val">{{ spectrum.meanPower }} dB</span></div>
          </v-card>
        </v-col>

        <!-- Positioner (show only if data received) -->
        <v-col cols="12" md="6" v-if="hasData.positioner || hasPositionerControl">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">Positioner</div>
            <div class="kerby-field"><span>Az (local)</span><span class="kerby-val">{{ positioner.azLocal }}&deg;</span></div>
            <div class="kerby-field"><span>El (local)</span><span class="kerby-val">{{ positioner.elLocal }}&deg;</span></div>
            <div class="kerby-field"><span>Az (earth)</span><span class="kerby-val">{{ positioner.azEarth }}&deg;</span></div>
            <div class="kerby-field"><span>El (earth)</span><span class="kerby-val">{{ positioner.elEarth }}&deg;</span></div>
            <template v-if="hasPositionerControl">
              <v-divider class="my-1" />
              <div class="text-caption font-weight-bold">Positioner Control</div>
              <v-row dense class="mt-1">
                <v-col cols="3"><v-text-field v-model.number="posForm.azimuth" label="Az (&deg;)" type="number" density="compact" variant="outlined" hide-details /></v-col>
                <v-col cols="3"><v-text-field v-model.number="posForm.elevation" label="El (&deg;)" type="number" density="compact" variant="outlined" hide-details /></v-col>
                <v-col cols="3"><v-text-field v-model.number="posForm.azSpeed" label="Az Spd" type="number" density="compact" variant="outlined" hide-details /></v-col>
                <v-col cols="3"><v-text-field v-model.number="posForm.elSpeed" label="El Spd" type="number" density="compact" variant="outlined" hide-details /></v-col>
              </v-row>
              <div class="d-flex ga-2 mt-1">
                <v-btn size="small" color="primary" variant="tonal" @click="sendPositionerCmd">Slew To</v-btn>
                <v-btn size="small" color="error" variant="tonal" @click="sendEmergencyStop">Emergency Stop</v-btn>
              </div>
            </template>
          </v-card>
        </v-col>

        <!-- Platform (show only if data received) -->
        <v-col cols="12" md="6" v-if="hasData.platform">
          <v-card variant="outlined" density="compact" class="pa-2">
            <div class="text-caption font-weight-bold text-primary">Platform Position</div>
            <div class="kerby-field"><span>Latitude</span><span class="kerby-val">{{ platform.lat }}</span></div>
            <div class="kerby-field"><span>Longitude</span><span class="kerby-val">{{ platform.lon }}</span></div>
            <div class="kerby-field"><span>Altitude</span><span class="kerby-val">{{ platform.alt }} m</span></div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.kerby-panel {
  font-size: 0.85rem;
}
.kerby-field {
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
  font-size: 0.8rem;
}
.kerby-field span:first-child {
  opacity: 0.7;
}
.kerby-val {
  font-family: 'Roboto Mono', monospace;
}
</style>
