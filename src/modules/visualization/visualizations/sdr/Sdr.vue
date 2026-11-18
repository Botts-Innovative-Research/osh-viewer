<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import DataStream from 'osh-js/source/core/consysapi/datastream/DataStream.js';
import ObservationFilter from 'osh-js/source/core/consysapi/observation/ObservationFilter.js';
import { OSHControlStream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { createDatasource, getLatestObservation } from '@/modules/visualization/services/datasource.service';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { ISdrViewProperties } from '../../types/views';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { useSystemStore } from '@/stores/systemstore';
import { useNodeStore } from '@/stores/nodestore';
import { useDataStreamStore } from '@/stores/datastreamstore';
import { sendCommand } from '../../services/controlstream.service';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: IConSysApiDataSourceProperties[];
	sdrView?: ISdrViewProperties & { roles?: Record<string, string> };
	controlstream?: OSHControlStream;
}>();

const controlstreamStore = useControlStreamStore();
const datastreamStore = useDataStreamStore();
const systemStore = useSystemStore();
const nodeStore = useNodeStore();
const datastreamStore = useDataStreamStore();
const sdrContainerId = ref(`sdr-${randomUUID()}`);
const spectrumCanvasRef = ref<HTMLCanvasElement | null>(null);
const waterfallCanvasRef = ref<HTMLCanvasElement | null>(null);

function getDatasourceList(): any[] {
	let list: any[] = [];
	if (Array.isArray(props.datasource)) {
		list = (props.datasource as any[]).flat().filter(Boolean);
	} else if (props.datasource) {
		list = [props.datasource];
	}

	if (list.length === 0) {
		const activeNode = nodeStore.nodes?.[0];
		const host = activeNode?.getEndpointUrl() || 'localhost:8181/sensorhub/api';
		list.push({
			id: '0410',
			datastreamId: '0410',
			resource: '/datastreams/0410/observations',
			endpointUrl: host,
			tls: activeNode?.tls ?? false,
			connectorOpts: {
				username: activeNode?.username || 'admin',
				password: activeNode?.password || 'test',
			},
		});
	}

	return list;
}

// Datasource instances
const dsInstances = ref<(typeof ConSysApi)[]>([]);


// State
const isLive = ref<boolean>(false);
const isPaused = ref<boolean>(false);
const centerFreqHz = ref<number>(98000000);
const sampleRateHz = ref<number>(2048000);
const numBins = ref<number>(1024);
const peakFreqMhz = ref<string>('---');
const peakDbVal = ref<string>('---');
const fps = ref<number>(0);
const hasStartStopActive = ref<boolean>(false);

// Visual settings
const autoDb = ref<boolean>(props.sdrView?.autoDb ?? true);
const minDb = ref<number>(props.sdrView?.minDb ?? -100);
const maxDb = ref<number>(props.sdrView?.maxDb ?? -20);
const averaging = ref<number>(props.sdrView?.averaging ?? 2);
const showWaterfall = ref<boolean>(props.sdrView?.waterfall ?? true);
const waterfallSpeed = ref<number>(props.sdrView?.waterfallSpeed ?? 2);
const colorPalette = ref<string>(props.sdrView?.colorPalette ?? 'heat');

// Hover & Tooltip
const hoverFreqText = ref<string>('');
const hoverDbText = ref<string>('');
const tooltipVisible = ref<boolean>(false);
const tooltipX = ref<number>(0);
const tooltipY = ref<number>(0);

// Hardware / Tuning state
const tuneMhzInput = ref<number>(98.0);
const isEditingTuneInput = ref<boolean>(false);
const editTuneText = ref<string>('98.000');

function formatFreqMhz(mhz: number): string {
	if (isNaN(mhz) || mhz <= 0) return '0.000';
	return mhz.toFixed(3);
}

const tuneMhzDisplay = computed({
	get: () => {
		if (isEditingTuneInput.value) {
			return editTuneText.value;
		}
		return formatFreqMhz(tuneMhzInput.value);
	},
	set: (val: string) => {
		editTuneText.value = val;
	},
});

const gainVal = ref<number>(20.7);
const autoGain = ref<boolean>(true);
const audioMode = ref<string>('OFF');
const operatingMode = ref<string>('SPECTRUM_AUDIO');

// Audio listening & recording state
const isListening = ref<boolean>(false);
const audioVolume = ref<number>(80);
const isRecordingAudio = ref<boolean>(false);

// Web Audio API engine
let audioCtx: any = null;
let audioGainNode: any = null;
let nextAudioStartTime = 0;
let audioWs: WebSocket | null = null;
let audioReconnectTimer: any = null;

// Internal DSP buffers
let smoothedBins: Float32Array | null = null;
let peakHoldBins: Float32Array | null = null;
const peakHoldDecay = 0.25;

let frameCounter = 0;
let lastFpsTime = Date.now();
let animFrameId: number | null = null;
let isRunning = true;
let broadcastChannels: BroadcastChannel[] = [];
let directWebSockets: WebSocket[] = [];
let rowCanvas: HTMLCanvasElement | null = null;
let rowCtx: CanvasRenderingContext2D | null = null;
let logCount = 0;

function initWaterfallCanvas() {
	const canvas = waterfallCanvasRef.value;
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	ctx.fillStyle = '#06090e';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Palette lookup table (256 RGB entries)
let paletteRgb = new Uint8Array(256 * 3);

function initPalette(scheme: string) {
	for (let i = 0; i < 256; i++) {
		const norm = i / 255.0;
		let r = 0;
		let g = 0;
		let b = 0;

		if (scheme === 'viridis') {
			r = Math.floor(255 * (0.28 + 0.72 * norm * norm));
			g = Math.floor(255 * (0.05 + 0.95 * Math.sin(norm * Math.PI * 0.9)));
			b = Math.floor(255 * (0.45 + 0.55 * (1.0 - norm)));
		} else if (scheme === 'jet') {
			const fourVal = 4 * norm;
			r = Math.min(255, Math.max(0, Math.floor(255 * (1.5 - Math.abs(fourVal - 3)))));
			g = Math.min(255, Math.max(0, Math.floor(255 * (1.5 - Math.abs(fourVal - 2)))));
			b = Math.min(255, Math.max(0, Math.floor(255 * (1.5 - Math.abs(fourVal - 1)))));
		} else if (scheme === 'cool') {
			r = Math.floor(255 * norm);
			g = Math.floor(255 * (1.0 - norm));
			b = 255;
		} else {
			// Standard RF Heat: Navy -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red -> White
			if (norm < 0.15) {
				const t = norm / 0.15;
				r = Math.floor(10 * t);
				g = Math.floor(15 * t);
				b = Math.floor(40 + 120 * t);
			} else if (norm < 0.35) {
				const t = (norm - 0.15) / 0.2;
				r = Math.floor(10 + 20 * t);
				g = Math.floor(15 + 185 * t);
				b = Math.floor(160 + 95 * t);
			} else if (norm < 0.55) {
				const t = (norm - 0.35) / 0.2;
				r = Math.floor(30 + 30 * t);
				g = Math.floor(200 + 40 * t);
				b = Math.floor(255 * (1.0 - t));
			} else if (norm < 0.75) {
				const t = (norm - 0.55) / 0.2;
				r = Math.floor(60 + 195 * t);
				g = Math.floor(240 + 15 * t);
				b = 0;
			} else if (norm < 0.9) {
				const t = (norm - 0.75) / 0.15;
				r = 255;
				g = Math.floor(255 * (1.0 - 0.7 * t));
				b = 0;
			} else {
				const t = (norm - 0.9) / 0.1;
				r = 255;
				g = Math.floor(76 + 179 * t);
				b = Math.floor(255 * t);
			}
		}

		paletteRgb[i * 3 + 0] = Math.min(255, Math.max(0, r));
		paletteRgb[i * 3 + 1] = Math.min(255, Math.max(0, g));
		paletteRgb[i * 3 + 2] = Math.min(255, Math.max(0, b));
	}
}

// HTL Driver & Connection Mode state
const isHtlDriver = ref<boolean>(false);
type HtlConnectionMode = '1GbE' | '10GbE' | 'BOTH' | 'UNKNOWN';
const connectionMode = ref<HtlConnectionMode>('UNKNOWN');
const showHtlControls = ref<boolean>(false);

// HTL 1GbE Sweep Configuration state
const htlStartFreqMhz = ref<number>(130.0);
const htlStopFreqMhz = ref<number>(170.0);
const htlNumPoints = ref<number>(1024);
const htlUpdateRate = ref<number>(10.0);

// HTL 1GbE Scout & Demod state
const htlScoutId = ref<number>(0);
const htlScoutFreqMhz = ref<number>(145.0);
const htlDemodMode = ref<string>('FM');
const htlSquelch = ref<number>(-80.0);
const htlVolume = ref<number>(75.0);

// Web Audio Demodulation & Playback state
const isAudioListening = ref<boolean>(false);
const audioSampleRate = ref<number>(44100);
const audioChannels = ref<number>(1);
const audioLevelDbfs = ref<number>(-100);
const audioFramesReceived = ref<number>(0);
const isAudioConnected = ref<boolean>(false);
const isRecordingAudio = ref<boolean>(false);
const recordingDurationSec = ref<number>(0);
let recordingTimerId: any = null;
let audioDsConnected = false;

const formattedRecordingTime = computed(() => {
	const mins = Math.floor(recordingDurationSec.value / 60);
	const secs = recordingDurationSec.value % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

const isAudioGateOpen = computed(() => {
	return audioLevelDbfs.value >= htlSquelch.value;
});

// HTL System Actions state
const htlServiceName = ref<string>('DDC');
const showRebootDialog = ref<boolean>(false);
const showResetDialog = ref<boolean>(false);

// HTL 10GbE DDC Tuner state
const htlTunerId = ref<number>(0);
const htlTunerMode = ref<string>('AutoTune');
const htlTunerFreqMhz = ref<number>(150.0);
const htlTxRxMode = ref<string>('Rx');
const htlTunerAgc = ref<boolean>(true);
const htlTunerAtten = ref<number>(0.0);
const htlTunerTxPower = ref<number>(0.0);
const htlTunerPreamp = ref<boolean>(false);
const htlTunerDrop = ref<boolean>(false);

// HTL 10GbE DDC Collector state
const htlCollectorSlot = ref<string>('iq0');
const htlCollectorTunerId = ref<number>(-1);
const htlCollectorFreqMhz = ref<number>(150.0);
const htlCollectorBwMhz = ref<number>(2.0);
const htlCollectorSampleRate = ref<number>(0);
const htlCollectorSnapshot = ref<number>(0);
const htlCollectorAgc = ref<boolean>(true);
const htlCollectorAtten = ref<number>(0.0);
const htlCollectorPreamp = ref<boolean>(false);
const htlCollectorTriggerType = ref<string>('None');
const htlCollectorId = ref<number>(-1);
const htlHaltType = ref<string>('All');

const connectionModeLabel = computed(() => {
	if (!isHtlDriver.value) return '';
	switch (connectionMode.value) {
		case '1GbE':
			return 'HTL 1 GbE';
		case '10GbE':
			return 'HTL 10 GbE';
		case 'BOTH':
			return 'HTL Dual 1/10 GbE';
		default:
			return 'HTL SDR';
	}
});

const connectionModeColor = computed(() => {
	switch (connectionMode.value) {
		case '1GbE':
			return 'success';
		case '10GbE':
			return 'purple';
		case 'BOTH':
			return 'cyan';
		default:
			return 'grey';
	}
});

const is1GbeCapable = computed(() => {
	return connectionMode.value === '1GbE' || connectionMode.value === 'BOTH' || connectionMode.value === 'UNKNOWN';
});

const is10GbeCapable = computed(() => {
	return connectionMode.value === '10GbE' || connectionMode.value === 'BOTH';
});

// Control Stream binding
const receiverControl = computed(() => {
<<<<<<< HEAD
	let csId = props.controlstream?.id;
	if (!csId && isHtlDriver.value) {
		const found = controlstreamStore.controlStreams.find(
			(cs: any) =>
				(cs.name || '').toLowerCase().includes('htl') ||
				(cs.id || '').toLowerCase().includes('htl') ||
				(cs.controlstream?.properties?.controlName || '').toLowerCase().includes('htl')
		);
		if (found) {
			csId = found.id;
		}
	}

	if (csId) {
		const controlStreams = controlstreamStore.getControlStreamsById([csId]);
		if (!controlStreams || controlStreams.length === 0)
			return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };

		const cs = controlStreams[0];
		const networkProps = cs.controlstream.networkProperties;
		const protocol = networkProps.tls ? 'https' : 'http';
		const baseUrl = `${protocol}://${networkProps.endpointUrl}`;
		const auth = `${networkProps.connectorOpts?.username ?? ''}:${networkProps.connectorOpts?.password ?? ''}`;

		return {
			hasControl: true,
			commandBaseUrl: baseUrl,
			id: csId,
			auth: auth,
		};
=======
	let cs: any = null;
	let csId = props.controlstream?.id;
	if (csId) {
		const found = controlstreamStore.getControlStreamsById([csId]);
		if (found && found.length > 0) cs = found[0];
>>>>>>> 2be0f592220eaaef39cc15ff2ff6a89387485912
	}
	// Auto-discovery fallback if props.controlstream wasn't passed or found
	if (!cs) {
		const allStreams = (controlstreamStore.controlStreams as any[]) || [];
		cs = allStreams.find((s: any) => {
			const name = (s.controlstream?.name || s.name || '').toLowerCase();
			const id = (s.controlstream?.id || s.id || '').toLowerCase();
			return name.includes('receiver') || name.includes('control') || name.includes('rtlsdr') ||
				id.includes('receiver') || id.includes('control');
		}) || allStreams[0];
		if (cs) csId = cs.controlstream?.id || cs.id;
	}

	if (!csId) {
		csId = '0410';
	}

	const activeNode = nodeStore.nodes?.[0];
	const networkProps = cs?.controlstream?.networkProperties || cs?.networkProperties;
	const protocol = (networkProps?.tls ?? activeNode?.tls) ? 'https' : 'http';
	const endpoint = networkProps?.endpointUrl || activeNode?.getEndpointUrl() || 'localhost:8181/sensorhub/api';
	const baseUrl = `${protocol}://${endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
	const username = networkProps?.connectorOpts?.username || activeNode?.username || 'admin';
	const password = networkProps?.connectorOpts?.password || activeNode?.password || 'test';
	const auth = `${username}:${password}`;

	return {
		hasControl: true,
		commandBaseUrl: baseUrl,
		id: csId,
		auth: auth,
	};
});

function buildReceiverParameters(overrides: Record<string, any>) {
	const currentMhz = overrides.centerFreq !== undefined
		? Number(overrides.centerFreq)
		: (tuneMhzInput.value || (centerFreqHz.value / 1e6) || 98.0);

	const isAg = overrides.autoGain !== undefined ? Boolean(overrides.autoGain) : autoGain.value;
	let gVal: number | null = null;
	if (!isAg) {
		gVal = overrides.gain !== undefined ? Number(overrides.gain) : Number(gainVal.value);
		if (isNaN(gVal)) gVal = 20.7;
	}

	const opMode = overrides.operatingMode || operatingMode.value || 'SPECTRUM_AUDIO';
	const aMode = overrides.audioMode !== undefined
		? (overrides.audioMode === 'OFF' ? 'OFF' : String(overrides.audioMode))
		: (audioMode.value === 'OFF' ? 'OFF' : String(audioMode.value));

	const sr = overrides.sampleRate !== undefined
		? Number(overrides.sampleRate)
		: (sampleRateHz.value || 2000000.0);

	const rec = overrides.recordAudio !== undefined
		? Boolean(overrides.recordAudio)
		: Boolean(isRecordingAudio.value);

	return {
		operatingMode: opMode,
		centerFreq: parseFloat(currentMhz.toFixed(4)),
		gain: gVal,
		autoGain: isAg,
		sampleRate: sr,
		agcMode: false,
		audioMode: aMode,
		recordAudio: rec,
	};
}

function sendReceiverCommand(params: Record<string, any>, label: string) {
	if (!receiverControl.value.hasControl) {
		console.warn('[SDR.vue] Cannot send command: receiverControl has no control stream');
		return;
	}
	const fullParams = buildReceiverParameters(params);
	console.log(`[SDR.vue] Sending ${label}:`, fullParams);
	const payload = { parameters: fullParams };

	const baseUrl = (typeof window !== 'undefined' && window.location)
		? '/sensorhub/api'
		: receiverControl.value.commandBaseUrl;

	sendCommand(
		baseUrl,
		receiverControl.value.id,
		payload,
		receiverControl.value.auth,
		label
	);
}

<<<<<<< HEAD
function sendHtlCommand(choiceName: string, params: Record<string, any>, label: string) {
	if (!receiverControl.value.hasControl) return;
	const payload = {
		parameters: {
			[choiceName]: params,
		},
	};
	sendCommand(
		receiverControl.value.commandBaseUrl,
		receiverControl.value.id,
		payload,
		receiverControl.value.auth,
		label
	);
}

function applyHtlSpectrumConfig() {
	const startHz = Number(htlStartFreqMhz.value) * 1e6;
	const stopHz = Number(htlStopFreqMhz.value) * 1e6;
	if (isNaN(startHz) || isNaN(stopHz) || stopHz <= startHz) return;
	sendHtlCommand(
		'configureSpectrum',
		{
			startFrequency: startHz,
			stopFrequency: stopHz,
			numPoints: Number(htlNumPoints.value),
			updateRate: Number(htlUpdateRate.value),
		},
		'Configure Spectrum'
	);
}

function applyHtlScout() {
	const cfHz = Number(htlScoutFreqMhz.value) * 1e6;
	if (isNaN(cfHz) || cfHz <= 0) return;
	sendHtlCommand(
		'controlScout',
		{
			scoutId: Number(htlScoutId.value),
			centerFrequency: cfHz,
			demodMode: htlDemodMode.value,
			squelch: Number(htlSquelch.value),
			volume: Number(htlVolume.value),
		},
		`Control Scout ${htlScoutId.value}`
	);
}

let audioCtx: AudioContext | null = null;
let audioGainNode: GainNode | null = null;
let nextPlayTime = 0;

function initAudioContext(sampleRate = 44100) {
	if (!audioCtx || audioCtx.state === 'closed') {
		const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
		if (!AudioContextClass) return;
		try {
			audioCtx = new AudioContextClass({
				sampleRate: sampleRate > 0 ? sampleRate : 44100,
				latencyHint: 'interactive',
			});
			audioGainNode = audioCtx.createGain();
			const vol = isAudioListening.value ? Math.max(0, Math.min(1, Number(htlVolume.value) / 100.0)) : 0;
			audioGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
			audioGainNode.connect(audioCtx.destination);
			nextPlayTime = 0;
		} catch (e) {
			console.warn('[SDR.vue] AudioContext init error:', e);
		}
	}
}

function toggleAudioListening() {
	isAudioListening.value = !isAudioListening.value;
	if (isAudioListening.value) {
		initAudioContext(audioSampleRate.value);
		if (audioCtx && audioCtx.state === 'suspended') {
			audioCtx.resume();
		}
		if (audioGainNode && audioCtx) {
			const vol = Math.max(0, Math.min(1, Number(htlVolume.value) / 100.0));
			audioGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
		}
	} else {
		if (audioGainNode && audioCtx) {
			audioGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
		}
	}
}

function onVolumeChanged(newVol: number) {
	if (audioGainNode && audioCtx && isAudioListening.value) {
		const vol = Math.max(0, Math.min(1, Number(newVol) / 100.0));
		audioGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
	}
}

function toggleAudioRecording() {
	if (isRecordingAudio.value) {
		sendHtlCommand('stopAudioRecording', { confirm: true }, 'Stop Audio Recording');
		isRecordingAudio.value = false;
		if (recordingTimerId) {
			clearInterval(recordingTimerId);
			recordingTimerId = null;
		}
	} else {
		sendHtlCommand('startAudioRecording', { directory: '', prefix: '' }, 'Start Audio Recording');
		isRecordingAudio.value = true;
		recordingDurationSec.value = 0;
		if (recordingTimerId) clearInterval(recordingTimerId);
		recordingTimerId = setInterval(() => {
			recordingDurationSec.value++;
		}, 1000);
	}
}

function pcmToFloat32(raw: any): Float32Array | null {
	if (!raw) return null;
	if (raw instanceof Float32Array) return raw;

	let uint8: Uint8Array;
	if (raw instanceof Uint8Array) {
		uint8 = raw;
	} else if (raw instanceof Int8Array) {
		uint8 = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
	} else if (raw instanceof ArrayBuffer) {
		uint8 = new Uint8Array(raw);
	} else if (Array.isArray(raw)) {
		if (raw.length === 0) return null;
		uint8 = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i++) {
			uint8[i] = raw[i] & 0xff;
		}
	} else if (typeof raw === 'string') {
		try {
			const binStr = atob(raw);
			uint8 = new Uint8Array(binStr.length);
			for (let i = 0; i < binStr.length; i++) {
				uint8[i] = binStr.charCodeAt(i);
			}
		} catch (_) {
			return null;
		}
	} else {
		return null;
	}

	const numSamples = Math.floor(uint8.byteLength / 2);
	if (numSamples === 0) return null;

	const view = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
	const floats = new Float32Array(numSamples);
	for (let i = 0; i < numSamples; i++) {
		floats[i] = view.getInt16(i * 2, true) / 32768.0;
	}
	return floats;
}

function handleAudioObservation(rawAudio: any, rate = 44100, channels = 1) {
	audioFramesReceived.value++;
	isAudioConnected.value = true;
	if (rate > 0) audioSampleRate.value = rate;
	if (channels > 0) audioChannels.value = channels;

	const floatData = pcmToFloat32(rawAudio);
	if (!floatData || floatData.length === 0) return;

	// Calculate RMS dBFS level
	let sumSq = 0;
	for (let i = 0; i < floatData.length; i++) {
		sumSq += floatData[i] * floatData[i];
	}
	const rms = Math.sqrt(sumSq / floatData.length);
	const dbfs = 20 * Math.log10(Math.max(1e-5, rms));
	audioLevelDbfs.value = Math.round(dbfs);

	if (!isAudioListening.value) return;

	// Squelch gating: if signal is below squelch threshold, do not play
	if (dbfs < htlSquelch.value) {
		return;
	}

	if (!audioCtx) {
		initAudioContext(rate);
	}
	if (!audioCtx) return;

	if (audioCtx.state === 'suspended') {
		audioCtx.resume();
	}

	if (audioGainNode) {
		const vol = Math.max(0, Math.min(1, Number(htlVolume.value) / 100.0));
		audioGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
	}

	try {
		const audioBuffer = audioCtx.createBuffer(1, floatData.length, rate);
		audioBuffer.copyToChannel(floatData, 0, 0);

		const source = audioCtx.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(audioGainNode!);

		const now = audioCtx.currentTime;
		if (nextPlayTime < now || nextPlayTime > now + 0.5) {
			nextPlayTime = now + 0.04;
		}
		source.start(nextPlayTime);
		nextPlayTime += audioBuffer.duration;
	} catch (playErr) {
		console.warn('[SDR.vue] Web Audio playback error:', playErr);
	}
}

function applyHtlTuner(freqMhz?: number) {
	const targetMhz = freqMhz ?? Number(htlTunerFreqMhz.value);
	const cfHz = targetMhz * 1e6;
	if (isNaN(cfHz) || cfHz <= 0) return;
	htlTunerFreqMhz.value = targetMhz;
	sendHtlCommand(
		'configureTuner',
		{
			tunerId: Number(htlTunerId.value),
			mode: htlTunerMode.value,
			centerFrequency: cfHz,
			txRxMode: htlTxRxMode.value,
			agcEnabled: Boolean(htlTunerAgc.value),
			attenuation: Number(htlTunerAtten.value || 0),
			txPower: Number(htlTunerTxPower.value || 0),
			enablePreamp: Boolean(htlTunerPreamp.value),
			dropResources: Boolean(htlTunerDrop.value),
		},
		`Configure Tuner ${htlTunerId.value}`
	);
}

function applyHtlCollectorStart() {
	const cfHz = Number(htlCollectorFreqMhz.value) * 1e6;
	const bwHz = Number(htlCollectorBwMhz.value) * 1e6;
	sendHtlCommand(
		'startCollector',
		{
			slot: htlCollectorSlot.value,
			tunerId: Number(htlCollectorTunerId.value),
			centerFrequency: cfHz,
			bandwidth: bwHz,
			sampleRate: Number(htlCollectorSampleRate.value || 0),
			snapshotNumSamples: Number(htlCollectorSnapshot.value || 0),
			agcEnabled: Boolean(htlCollectorAgc.value),
			attenuation: Number(htlCollectorAtten.value || 0),
			enablePreamp: Boolean(htlCollectorPreamp.value),
			triggerType: htlCollectorTriggerType.value,
			triggerStartTime: new Date().toISOString(),
			collectorId: Number(htlCollectorId.value),
		},
		`Start Collector ${htlCollectorSlot.value}`
	);
}

function applyHtlCollectorStop() {
	sendHtlCommand(
		'stopCollector',
		{
			slot: htlCollectorSlot.value,
			collectorId: -1,
		},
		`Stop Collector ${htlCollectorSlot.value}`
	);
}

function applyHtlHalt() {
	sendHtlCommand(
		'halt',
		{
			type: htlHaltType.value,
		},
		`Halt ${htlHaltType.value}`
	);
}

function applyHtlRefreshStatus() {
	sendHtlCommand(
		'refreshStatus',
		{
			confirm: true,
		},
		'Refresh Status'
	);
}

function applyHtlStartService() {
	if (!htlServiceName.value) return;
	sendHtlCommand(
		'startService',
		{
			serviceName: htlServiceName.value,
		},
		`Start Service ${htlServiceName.value}`
	);
}

function confirmHtlReset() {
	showResetDialog.value = false;
	sendHtlCommand(
		'resetUnit',
		{
			confirm: true,
		},
		'Reset Unit'
	);
}

function confirmHtlReboot() {
	showRebootDialog.value = false;
	sendHtlCommand(
		'rebootUnit',
		{
			confirm: true,
		},
		'Reboot Unit'
=======
// Web Audio API playback engine
function initAudioEngine() {
	if (!audioCtx) {
		const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
		if (AudioContextClass) {
			audioCtx = new AudioContextClass({ sampleRate: 48000 });
			audioGainNode = audioCtx.createGain();
			const volNorm = audioVolume.value / 100.0;
			audioGainNode.gain.setValueAtTime(volNorm, audioCtx.currentTime);
			audioGainNode.connect(audioCtx.destination);
		}
	}
	if (audioCtx && audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
}

function playPcmChunk(pcmBytes: Uint8Array, channels: number, sampleRate: number = 48000) {
	if (!isListening.value || !audioCtx || audioCtx.state !== 'running') return;
	const ch = channels === 2 ? 2 : 1;
	const int16Samples = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, Math.floor(pcmBytes.byteLength / 2));
	const totalSamples = int16Samples.length;
	if (totalSamples === 0) return;

	let audioBuf: AudioBuffer;
	if (ch === 2) {
		const numFrames = Math.floor(totalSamples / 2);
		audioBuf = audioCtx.createBuffer(2, numFrames, sampleRate);
		const left = audioBuf.getChannelData(0);
		const right = audioBuf.getChannelData(1);
		for (let i = 0; i < numFrames; i++) {
			left[i] = int16Samples[i * 2] / 32768.0;
			right[i] = int16Samples[i * 2 + 1] / 32768.0;
		}
	} else {
		audioBuf = audioCtx.createBuffer(1, totalSamples, sampleRate);
		const mono = audioBuf.getChannelData(0);
		for (let i = 0; i < totalSamples; i++) {
			mono[i] = int16Samples[i] / 32768.0;
		}
	}

	const now = audioCtx.currentTime;
	if (nextAudioStartTime < now || nextAudioStartTime > now + 0.35) {
		nextAudioStartTime = now + 0.05; // 50ms buffer lead
	}

	const src = audioCtx.createBufferSource();
	src.buffer = audioBuf;
	if (audioGainNode) {
		src.connect(audioGainNode);
	} else {
		src.connect(audioCtx.destination);
	}
	src.start(nextAudioStartTime);
	nextAudioStartTime += audioBuf.duration;
}

function processIncomingAudioBinary(buffer: ArrayBuffer) {
	if (buffer.byteLength < 20) return;
	const dv = new DataView(buffer);
	const sampleRate = dv.getInt32(8, false); // big-endian
	const channels = dv.getInt32(12, false);   // big-endian
	const numBytes = dv.getInt32(16, false);   // big-endian

	if (numBytes > 0 && buffer.byteLength >= 20 + numBytes) {
		const pcmBytes = new Uint8Array(buffer, 20, numBytes);
		playPcmChunk(pcmBytes, channels, sampleRate || 48000);
	}
}

async function connectAudioStream() {
	if (!isRunning) return;

	// Look up audio datastream
	const allStreams = (datastreamStore.dataStreams as any[]) || [];
	const audioStream = allStreams.find((s: any) => {
		const outName = (s.outputName || s.datastream?.properties?.outputName || '').toLowerCase();
		const name = (s.name || s.datastream?.properties?.name || '').toLowerCase();
		return outName.includes('audio') || name.includes('audio') || name.includes('demodulated');
	});

	let audioDsId = audioStream?.id || audioStream?.datastream?.id || '0430';

	const activeNode = nodeStore.nodes?.[0];
	const endpoint = (activeNode?.getEndpointUrl() || 'localhost:8181/sensorhub/api')
		.replace(/^https?:\/\//, '')
		.replace(/^wss?:\/\//, '')
		.replace(/\/datastreams.*$/, '')
		.replace(/\/+$/, '');
	const wsProtocol = activeNode?.tls ? 'wss' : 'ws';

	const user = activeNode?.username || 'admin';
	const pass = activeNode?.password || 'test';
	const authHeaders: Record<string, string> = {
		Authorization: 'Basic ' + btoa(`${user}:${pass}`),
	};

	try {
		const listRes = await fetch(`/sensorhub/api/datastreams`, {
			headers: authHeaders,
			credentials: 'include',
		});
		if (listRes.ok) {
			const list = await listRes.json();
			const items: any[] = Array.isArray(list) ? list : (list.items || []);
			const matched = items.find((d: any) => {
				const n = (d.name || '').toLowerCase();
				const o = (d.outputName || '').toLowerCase();
				return o.includes('audio') || n.includes('demodulated audio') || n.includes('audio');
			});
			if (matched && matched.id) {
				audioDsId = matched.id;
			}
		}
	} catch (_) {}

	console.log('[SDR.vue] Connecting to audio stream ID:', audioDsId);

	const candidateUrls: string[] = [];
	if (typeof window !== 'undefined' && window.location && window.location.host) {
		const locProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
		candidateUrls.push(`${locProto}://${window.location.host}/sensorhub/api/datastreams/${audioDsId}/observations?format=application/swe%2Bbinary`);
	}
	candidateUrls.push(`${wsProtocol}://${endpoint}/datastreams/${audioDsId}/observations?format=application/swe%2Bbinary`);

	let candIdx = 0;
	function tryNextAudioUrl() {
		if (!isRunning || candIdx >= candidateUrls.length) return;
		const url = candidateUrls[candIdx++];
		console.log(`[SDR.vue] Attempting Audio WebSocket to: ${url}`);

		try {
			const ws = new WebSocket(url);
			ws.binaryType = 'arraybuffer';
			audioWs = ws;

			ws.onopen = () => {
				console.log('[SDR.vue] Audio WebSocket connected successfully to:', url);
			};

			ws.onmessage = (event) => {
				if (event.data instanceof ArrayBuffer) {
					processIncomingAudioBinary(event.data);
				}
			};

			ws.onerror = (e) => {
				console.warn('[SDR.vue] Audio WS error on ' + url + ':', e);
			};

			ws.onclose = (e) => {
				console.log(`[SDR.vue] Audio WS closed (${url}) code=${e.code}`);
				if (isRunning) {
					if (candIdx < candidateUrls.length) {
						setTimeout(() => { if (isRunning) tryNextAudioUrl(); }, 500);
					} else {
						if (audioReconnectTimer) clearTimeout(audioReconnectTimer);
						audioReconnectTimer = setTimeout(() => {
							if (isRunning) {
								candIdx = 0;
								tryNextAudioUrl();
							}
						}, 3000);
					}
				}
			};
		} catch (err) {
			console.warn('[SDR.vue] Error creating Audio WebSocket:', err);
			tryNextAudioUrl();
		}
	}

	tryNextAudioUrl();
}

function toggleAudioListen() {
	isListening.value = !isListening.value;
	if (isListening.value) {
		initAudioEngine();
		if (audioMode.value === 'OFF') {
			const mhz = tuneMhzInput.value;
			const defaultMode = (mhz >= 88.0 && mhz <= 108.0) ? 'WFM' : (mhz >= 118.0 && mhz <= 137.0 ? 'AM' : 'NFM');
			applyAudioMode(defaultMode);
		}
	}
}

function onVolumeChange(val: number) {
	audioVolume.value = val;
	const volNorm = val / 100.0;
	if (audioGainNode && audioCtx) {
		audioGainNode.gain.setValueAtTime(volNorm, audioCtx.currentTime);
	}
}

function toggleAudioRecord() {
	isRecordingAudio.value = !isRecordingAudio.value;
	sendReceiverCommand(
		{ recordAudio: isRecordingAudio.value },
		isRecordingAudio.value ? 'Start Audio Recording' : 'Stop Audio Recording'
>>>>>>> 2be0f592220eaaef39cc15ff2ff6a89387485912
	);
}

// Interactive Tune actions
function tuneToMhz(targetMhz: number) {
	if (targetMhz <= 0) return;
	tuneMhzInput.value = parseFloat(targetMhz.toFixed(4));
	if (!isEditingTuneInput.value) {
		editTuneText.value = formatFreqMhz(tuneMhzInput.value);
	}
	if (!hasStartStopActive.value) {
		centerFreqHz.value = Math.round(targetMhz * 1e6);
	}
<<<<<<< HEAD
	if (receiverControl.value.hasControl) {
		if (isHtlDriver.value) {
			if (connectionMode.value === '10GbE') {
				applyHtlTuner(targetMhz);
			} else {
				htlScoutFreqMhz.value = targetMhz;
				applyHtlScout();
			}
		} else {
			sendReceiverCommand({ centerFreq: targetMhz }, `Tune to ${targetMhz} MHz`);
		}
	}
=======
	sendReceiverCommand({ centerFreq: targetMhz }, `Tune to ${targetMhz} MHz`);
>>>>>>> 2be0f592220eaaef39cc15ff2ff6a89387485912
}

function onTuneFocus() {
	isEditingTuneInput.value = true;
	editTuneText.value = tuneMhzDisplay.value;
}

function onTuneBlur() {
	applyTuneInput();
}

function applyTuneInput() {
	const val = parseFloat(editTuneText.value);
	if (!isNaN(val) && val > 0) {
		tuneToMhz(val);
	}
	isEditingTuneInput.value = false;
	editTuneText.value = formatFreqMhz(tuneMhzInput.value);
}

function stepFreq(deltaMhz: number) {
	const current = Number(tuneMhzInput.value) || 0;
	const newFreq = parseFloat((current + deltaMhz).toFixed(4));
	tuneToMhz(newFreq);
}

function applyGain() {
	sendReceiverCommand({ gain: String(gainVal.value), autoGain: false }, `Set Gain ${gainVal.value} dB`);
}

function toggleAutoGain() {
	autoGain.value = !autoGain.value;
	sendReceiverCommand({ autoGain: autoGain.value }, `Auto Gain ${autoGain.value ? 'ON' : 'OFF'}`);
}

function applyAudioMode(mode: string) {
	audioMode.value = mode;
	if (mode !== 'OFF' && !isListening.value) {
		initAudioEngine();
		isListening.value = true;
	} else if (mode === 'OFF' && isListening.value) {
		isListening.value = false;
	}
	sendReceiverCommand({ audioMode: mode }, `Demod Mode ${mode}`);
}

function applyOperatingMode(mode: string) {
	operatingMode.value = mode;
	sendReceiverCommand({ operatingMode: mode }, `Operating Mode ${mode}`);
}

// Helpers to unpack SWE-JSON / OM-JSON / ConSys records
function flattenRecord(raw: any): Record<string, any> {
	if (!raw) return {};

	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			try {
				return flattenRecord(JSON.parse(trimmed));
			} catch (_) {}
		}
		return {};
	}

	if (typeof raw !== 'object') return {};

	if (Array.isArray(raw)) {
		return raw.length > 0 ? flattenRecord(raw[0]) : {};
	}

	let merged: Record<string, any> = { ...raw };

	if (raw.result && typeof raw.result === 'object') {
		const unResult = flattenRecord(raw.result);
		merged = { ...merged, ...unResult };
	}
	if (raw.data && typeof raw.data === 'object') {
		const unData = flattenRecord(raw.data);
		merged = { ...merged, ...unData };
	}
	if (Array.isArray(raw.values) && raw.values.length > 0) {
		if (typeof raw.values[0] === 'object') {
			const unValues = flattenRecord(raw.values[0]);
			merged = { ...merged, ...unValues };
		} else {
			merged.values = raw.values;
		}
	}

	// Merge all nested child objects (e.g. raw.rtlsdr_spectrum, raw.rtlsdr_settings, raw.output)
	for (const key of Object.keys(raw)) {
		const val = raw[key];
		if (
			val &&
			typeof val === 'object' &&
			!Array.isArray(val) &&
			!(val instanceof Float32Array) &&
			!(val instanceof Float64Array)
		) {
			for (const subKey of Object.keys(val)) {
				if (merged[subKey] === undefined) {
					merged[subKey] = val[subKey];
				}
			}
		}
	}

	return merged;
}

function extractNumericArray(raw: any): number[] | null {
	if (!raw) return null;
	if (Array.isArray(raw)) {
		if (raw.length === 0) return [];
		if (typeof raw[0] === 'number') {
			return raw.map((n: number) => isFinite(n) ? n : -120);
		}
		// Handle array of objects e.g. [{ amplitude: -45.2 }] or arrays [[-45.2]]
		return raw.map((item: any) => {
			if (typeof item === 'number') return isFinite(item) ? item : -120;
			if (Array.isArray(item)) return Number(item[0]) || -100;
			if (item && typeof item === 'object') {
				const v = Number(item.amplitude ?? item.value ?? item.power ?? Object.values(item)[0]);
				return isFinite(v) ? v : -100;
			}
			const n = Number(item);
			return isFinite(n) ? n : -100;
		});
	}
	if (raw instanceof Float32Array || raw instanceof Float64Array) {
		return Array.from(raw).map((n) => isFinite(n) ? n : -120);
	}
	if (typeof raw === 'string') {
		const parts = raw.trim().split(/[\s,]+/);
		if (parts.length > 1) {
			const nums = parts.map(Number).filter((n) => !isNaN(n));
			if (nums.length > 0) return nums;
		}
	}
	if (typeof raw === 'object') {
		if (Array.isArray(raw.value)) return extractNumericArray(raw.value);
		if (Array.isArray(raw.values)) return extractNumericArray(raw.values);
		if (Array.isArray(raw.elements)) return extractNumericArray(raw.elements);
		if (Array.isArray(raw.data)) return extractNumericArray(raw.data);
		if (Array.isArray(raw.array)) return extractNumericArray(raw.array);
		if (raw.buffer && raw.byteLength) {
			return Array.from(new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4));
		}
		const vals = Object.values(raw);
		if (vals.length > 0 && typeof vals[0] === 'number') {
			return vals as number[];
		}
	}
	return null;
}

// Handler for CSV text formatted observations
function handleCsvObservation(text: string) {
	if (!text) return;
	const lines = text.trim().split(/\r?\n/);
	for (const line of lines) {
		const tokens = line.trim().split(',');
		if (tokens.length < 5) continue;

		// Field 1: center_frequency
		const cf = Number(tokens[1]);
		if (!isNaN(cf) && cf > 0) {
			const freqHz = cf < 10000 ? cf * 1e6 : cf;
			centerFreqHz.value = freqHz;
			tuneMhzInput.value = parseFloat((freqHz / 1e6).toFixed(4));
		}

		// Field 2: freq_count
		const freqCount = parseInt(tokens[2], 10);
		if (!isNaN(freqCount) && freqCount > 0 && tokens.length > 3 + freqCount + 1) {
			const ampCountIdx = 3 + freqCount;
			const ampCount = parseInt(tokens[ampCountIdx], 10);
			const ampStart = ampCountIdx + 1;
			const amps = tokens.slice(ampStart, ampStart + ampCount).map(Number);
			handleObservationData({ amplitude: amps, center_frequency: cf });
		} else {
			// Fallback: remainder of tokens are numeric amplitude bins
			const amps = tokens.slice(2).map(Number).filter((n) => !isNaN(n));
			if (amps.length > 10) {
				handleObservationData({ amplitude: amps, center_frequency: cf });
			}
		}
	}
}

// Process incoming WebSocket text frame (handles JSON, JSON-lines, CSV)
function processIncomingText(text: string) {
	if (!text) return;
	const trimmed = text.trim();
	if (!trimmed) return;

	if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
		try {
			const parsed = JSON.parse(trimmed);
			handleObservationData(parsed);
			return;
		} catch (_) {
			// Try splitting by newline in case multiple JSON lines arrived in one frame
			const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
			let anyParsed = false;
			for (const line of lines) {
				if (line.startsWith('{') || line.startsWith('[')) {
					try {
						const parsedLine = JSON.parse(line);
						handleObservationData(parsedLine);
						anyParsed = true;
					} catch (_) {}
				}
			}
			if (anyParsed) return;
		}
	}

	// Fallback to CSV
	handleCsvObservation(trimmed);
}

// Data stream message handler
function handleObservationData(input: any) {
	if (isPaused.value || !input) return;

	const data = flattenRecord(input);

	if (logCount < 10 || logCount % 200 === 0) {
		console.log('[SDR.vue] Observation packet #' + logCount + ':', data);
	}
	logCount++;

	// 0. Demodulated audio payload handling
	const audioKey = props.sdrView?.roles?.audio;
	const rawAudio =
		(audioKey && data[audioKey] !== undefined ? data[audioKey] : undefined) ??
		data.audioData ??
		data.pcmAudio ??
		data.audio_data ??
		data['Audio Data'] ??
		data.pcm_data ??
		data.audio;

	if (rawAudio !== undefined && rawAudio !== null) {
		const rate = Number(data.sampleRate ?? data.sample_rate ?? data['Sample Rate'] ?? 44100);
		const ch = Number(data.channels ?? data.channelCount ?? 1);
		handleAudioObservation(rawAudio, rate, ch);

		if (data.scoutId !== undefined && !isNaN(Number(data.scoutId))) {
			htlScoutId.value = Number(data.scoutId);
		}
		if (data.centerFrequency && Number(data.centerFrequency) > 0) {
			const cfMhz = Number(data.centerFrequency) / 1e6;
			if (htlScoutFreqMhz.value === 145.0 || Math.abs(htlScoutFreqMhz.value - cfMhz) > 0.001) {
				htlScoutFreqMhz.value = parseFloat(cfMhz.toFixed(3));
			}
		}

		// If purely an audio record without RF spectrum bins, return early
		if (!data.amplitude && !data.rtlsdr_spectrum && !data.psd && !data.spectrum && !data.values) {
			return;
		}
	}

	// 1. Settings / status updates
	const mode = data.operatingMode ?? data.operating_mode ?? data.mode;
	if (mode) {
		operatingMode.value = String(mode);
	}
	const gain = data.tunerGain ?? data.tuner_gain ?? data.gain;
	if (gain !== undefined) {
		gainVal.value = Number(gain);
	}
	const ag = data.autoGain ?? data.auto_gain;
	if (ag !== undefined) {
		autoGain.value = Boolean(ag);
	}
	const am = data.audioMode ?? data.audio_mode ?? data.demodMode;
	if (am) {
		audioMode.value = String(am);
	}
	const isRec = data.AudioRecordingActive ?? data.audioRecordingActive ?? data.recordAudio ?? data.isRecordingAudio;
	if (isRec !== undefined) {
		isRecordingAudio.value = Boolean(isRec);
	}

	// Start & Stop Frequency detection (e.g. HTL driver, swept spectrum, or frequency-range streams)
	const startKey = props.sdrView?.roles?.startFrequency;
	const stopKey = props.sdrView?.roles?.stopFrequency;
	const rawStartFreq =
		(startKey && data[startKey] !== undefined ? data[startKey] : undefined) ??
		data.startFrequency ??
		data.start_frequency ??
		data['Start Frequency'] ??
		data.startFreq ??
		data.start_freq ??
		data.freqStart ??
		data.minFrequency ??
		data.min_frequency;

	const rawStopFreq =
		(stopKey && data[stopKey] !== undefined ? data[stopKey] : undefined) ??
		data.stopFrequency ??
		data.stop_frequency ??
		data['Stop Frequency'] ??
		data.stopFreq ??
		data.stop_freq ??
		data.freqStop ??
		data.maxFrequency ??
		data.max_frequency;

	let numStartFreq = Number(rawStartFreq);
	let numStopFreq = Number(rawStopFreq);
	if (!isNaN(numStartFreq) && numStartFreq > 0 && numStartFreq < 10000) numStartFreq *= 1e6;
	if (!isNaN(numStopFreq) && numStopFreq > 0 && numStopFreq < 10000) numStopFreq *= 1e6;

	const hasStartStop = !isNaN(numStartFreq) && !isNaN(numStopFreq) && numStopFreq > numStartFreq && numStartFreq > 0;
	hasStartStopActive.value = hasStartStop;

	if (hasStartStop) {
		const spanFromBounds = numStopFreq - numStartFreq;
		const centerFromBounds = (numStartFreq + numStopFreq) / 2.0;
		sampleRateHz.value = Math.round(spanFromBounds);
		centerFreqHz.value = Math.round(centerFromBounds);
		if (Math.abs(tuneMhzInput.value * 1e6 - centerFromBounds) > spanFromBounds / 2.0 || tuneMhzInput.value === 98.0) {
			tuneMhzInput.value = parseFloat((centerFromBounds / 1e6).toFixed(4));
		}
		if (htlStartFreqMhz.value === 130.0 && htlStopFreqMhz.value === 170.0) {
			htlStartFreqMhz.value = parseFloat((numStartFreq / 1e6).toFixed(3));
			htlStopFreqMhz.value = parseFloat((numStopFreq / 1e6).toFixed(3));
		}
	}

	// Center Frequency (Hz)
	const cfKey = props.sdrView?.roles?.centerFrequency;
	const isCfKeyStart = cfKey && (cfKey === 'startFrequency' || cfKey === 'start_frequency' || cfKey === 'startFreq');
	if (!hasStartStop || !isCfKeyStart) {
		const rawCenterFreq =
			(cfKey && !isCfKeyStart && data[cfKey] !== undefined ? data[cfKey] : undefined) ??
			data.center_frequency ??
			data.centerFrequency ??
			data['Center Frequency'] ??
			data.centerFreq ??
			data.center_freq ??
			data.frequency;

		const numCenterFreq = Number(rawCenterFreq);
		if (!isNaN(numCenterFreq) && numCenterFreq > 0) {
			const freqHz = numCenterFreq < 10000 ? numCenterFreq * 1e6 : numCenterFreq;
			if (!hasStartStop || (freqHz > numStartFreq && freqHz < numStopFreq)) {
				centerFreqHz.value = freqHz;
				tuneMhzInput.value = parseFloat((freqHz / 1e6).toFixed(4));
			}
		}
	}

	// Sample Rate / Span (Hz)
	const srKey = props.sdrView?.roles?.sampleRate;
	const rawSampleRate =
		(srKey && data[srKey] !== undefined ? data[srKey] : undefined) ??
		data.sampleRate ??
		data.sample_rate ??
		data['Sample Rate'] ??
		data.bandwidth ??
		data.bandwidthHz ??
		data.span ??
		data.spanHz;

	const numSampleRate = Number(rawSampleRate);
	if (!isNaN(numSampleRate) && numSampleRate > 0) {
		sampleRateHz.value = numSampleRate;
	}

	// Optional: Check frequency_axis to calibrate span & center
	const faKey = props.sdrView?.roles?.frequencyAxis;
	const rawFreqAxis =
		(faKey && data[faKey] !== undefined ? data[faKey] : undefined) ??
		data.frequency_axis ??
		data.frequencyAxis ??
		data['Frequency Axis'] ??
		data.freq_axis;
	const freqAxis = extractNumericArray(rawFreqAxis);
	if (freqAxis && freqAxis.length >= 2) {
		const span = Math.abs(freqAxis[freqAxis.length - 1] - freqAxis[0]);
		const mid = (freqAxis[0] + freqAxis[freqAxis.length - 1]) / 2.0;
		if (span > 0 && !hasStartStop && isNaN(numSampleRate)) {
			sampleRateHz.value = Math.round(span);
		}
		if (!hasStartStop && isNaN(Number(data.center_frequency ?? data.centerFrequency))) {
			centerFreqHz.value = Math.round(mid);
			tuneMhzInput.value = parseFloat((mid / 1e6).toFixed(4));
		}
	}

	// 2. Spectrum amplitude bins
	const ampKey = props.sdrView?.roles?.amplitude;
	const rawAmp =
		(ampKey && data[ampKey] !== undefined ? data[ampKey] : undefined) ??
		data.amplitude ??
		data.SpectrumAmplitude ??
		data['Spectrum Amplitude'] ??
		data.powerSpectrum ??
		data.power_spectrum ??
		data['Power Spectrum'] ??
		data.values ??
		data.value ??
		data.psd ??
		data.power ??
		data.spectrum ??
		data.rf_spectrum;
	const ampArray = extractNumericArray(rawAmp);

	if (!ampArray || ampArray.length === 0) {
		return;
	}

	const count = ampArray.length;
	numBins.value = count;
	isLive.value = true;
	frameCounter++;

	// Update FPS
	const now = Date.now();
	if (now - lastFpsTime >= 1000) {
		fps.value = frameCounter;
		frameCounter = 0;
		lastFpsTime = now;
	}

	// Initialize DSP buffers
	if (!smoothedBins || smoothedBins.length !== count) {
		smoothedBins = new Float32Array(count);
		peakHoldBins = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			const v = Number(ampArray[i]) || -100.0;
			smoothedBins[i] = v;
			peakHoldBins[i] = v;
		}
	}

	// Exponential smoothing & Peak-Hold
	const alpha = 1.0 / Math.max(1, averaging.value);
	let maxPower = -999;
	let minPower = 999;
	let maxBinIndex = 0;

	for (let i = 0; i < count; i++) {
		const val = Number(ampArray[i]);
		const cleanVal = isNaN(val) || !isFinite(val) ? -100.0 : val;

		smoothedBins[i] = (1.0 - alpha) * smoothedBins[i] + alpha * cleanVal;

		if (cleanVal > peakHoldBins[i]) {
			peakHoldBins[i] = cleanVal;
		} else {
			peakHoldBins[i] -= peakHoldDecay;
		}

		if (cleanVal > maxPower) {
			maxPower = cleanVal;
			maxBinIndex = i;
		}
		if (cleanVal < minPower) {
			minPower = cleanVal;
		}
	}

	// Peak frequency readout
	const startFreqHz = centerFreqHz.value - sampleRateHz.value / 2.0;
	const binWidthHz = sampleRateHz.value / count;
	const peakHz = startFreqHz + maxBinIndex * binWidthHz;
	peakFreqMhz.value = (peakHz / 1e6).toFixed(3);
	peakDbVal.value = maxPower.toFixed(1);

	// Auto-dB floor/ceiling tracking
	if (autoDb.value && minPower < 500 && maxPower > -500 && minPower <= maxPower) {
		const targetMin = Math.max(-140, Math.min(-30, Math.floor(minPower - 6)));
		const targetMax = Math.max(targetMin + 15, Math.min(10, Math.ceil(maxPower + 10)));
		minDb.value = Math.round(0.85 * minDb.value + 0.15 * targetMin);
		maxDb.value = Math.round(0.85 * maxDb.value + 0.15 * targetMax);
		if (maxDb.value <= minDb.value) maxDb.value = minDb.value + 20;
	}

	// Waterfall spectrogram update
	if (showWaterfall.value && waterfallCanvasRef.value) {
		renderWaterfallRow(smoothedBins);
	}
}

// Canvas rendering
function renderSpectrum() {
	const canvas = spectrumCanvasRef.value;
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const w = canvas.width;
	const h = canvas.height;
	if (w <= 0 || h <= 0) return;

	ctx.fillStyle = '#06090e';
	ctx.fillRect(0, 0, w, h);

	const min = minDb.value;
	const max = maxDb.value;
	const dbRange = Math.max(1, max - min);

	const plotTop = 10;
	const plotBottom = h - 28;
	const plotH = Math.max(1, plotBottom - plotTop);

	// dBFS Horizontal grid lines
	ctx.strokeStyle = '#172033';
	ctx.lineWidth = 1;
	ctx.font = 'bold 10px monospace';
	ctx.fillStyle = '#94a3b8';

	const stepDb = dbRange <= 40 ? 10 : dbRange <= 80 ? 20 : 30;
	const startDb = Math.ceil(min / stepDb) * stepDb;
	for (let db = startDb; db <= max; db += stepDb) {
		const y = plotBottom - ((db - min) / dbRange) * plotH;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(w, y);
		ctx.stroke();
		ctx.fillText(`${db} dB`, 6, y - 3);
	}

	// Frequency Vertical grid lines
	const spanHz = sampleRateHz.value;
	const startFreqHz = centerFreqHz.value - spanHz / 2.0;
	const numDivs = 8;
	for (let f = 0; f <= numDivs; f++) {
		const x = (f / numDivs) * w;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, plotBottom);
		ctx.stroke();
	}

	// X-axis baseline
	ctx.strokeStyle = '#334155';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(0, plotBottom);
	ctx.lineTo(w, plotBottom);
	ctx.stroke();

	// Frequency tick numbers (numbers only without "MHz")
	ctx.font = 'bold 10px monospace';
	ctx.fillStyle = '#94a3b8';
	for (let f = 0; f <= numDivs; f++) {
		const x = (f / numDivs) * w;
		const freqAtX = (startFreqHz + (f / numDivs) * spanHz) / 1e6;
		ctx.textAlign = f === 0 ? 'left' : f === numDivs ? 'right' : 'center';
		const posX = f === 0 ? 4 : f === numDivs ? w - 4 : x;
		ctx.fillText(freqAtX.toFixed(3), posX, plotBottom + 13);
	}

	// X-axis unit label "MHz" in slightly larger font below the axis numbers
	ctx.font = 'bold 12px sans-serif';
	ctx.fillStyle = '#38bdf8';
	ctx.textAlign = 'center';
	ctx.fillText('MHz', w / 2.0, h - 3);
	ctx.textAlign = 'left';

	// Center frequency marker (Amber dash)
	const centerX = w / 2.0;
	ctx.save();
	ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
	ctx.setLineDash([4, 4]);
	ctx.beginPath();
	ctx.moveTo(centerX, 0);
	ctx.lineTo(centerX, plotBottom);
	ctx.stroke();
	ctx.restore();

	// Tuned frequency marker (Rose-500) if within visible span and distinct from center
	const tunedHz = tuneMhzInput.value * 1e6;
	if (tunedHz >= startFreqHz && tunedHz <= startFreqHz + spanHz && Math.abs(tunedHz - centerFreqHz.value) > 100) {
		const tunedX = ((tunedHz - startFreqHz) / spanHz) * w;
		ctx.save();
		ctx.strokeStyle = '#f43f5e';
		ctx.lineWidth = 1.5;
		ctx.setLineDash([2, 2]);
		ctx.beginPath();
		ctx.moveTo(tunedX, 0);
		ctx.lineTo(tunedX, plotBottom);
		ctx.stroke();
		ctx.fillStyle = '#f43f5e';
		ctx.font = 'bold 9px monospace';
		ctx.fillText(`${tuneMhzInput.value.toFixed(3)}`, Math.min(Math.max(tunedX + 4, 4), w - 65), 14);
		ctx.restore();
	}

	if (!smoothedBins || smoothedBins.length < 2) {
		ctx.fillStyle = '#64748b';
		ctx.font = '13px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('Awaiting SDR RF spectrum data...', w / 2, (plotTop + plotBottom) / 2);
		ctx.textAlign = 'left';
		return;
	}

	const bins = smoothedBins;
	const count = bins.length;
	const denom = count - 1;

	// Peak-hold line (Amber)
	if (peakHoldBins) {
		ctx.beginPath();
		for (let i = 0; i < count; i++) {
			const x = (i / denom) * w;
			const val = Math.max(min, Math.min(max, peakHoldBins[i]));
			const y = plotBottom - ((val - min) / dbRange) * plotH;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
		ctx.lineWidth = 1.0;
		ctx.stroke();
	}

	// Spectrum fill polygon
	ctx.beginPath();
	ctx.moveTo(0, plotBottom);
	for (let i = 0; i < count; i++) {
		const x = (i / denom) * w;
		const val = Math.max(min, Math.min(max, bins[i]));
		const y = plotBottom - ((val - min) / dbRange) * plotH;
		ctx.lineTo(x, y);
	}
	ctx.lineTo(w, plotBottom);
	ctx.closePath();

	const grad = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
	grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
	grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
	grad.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
	ctx.fillStyle = grad;
	ctx.fill();

	// Neon Cyan spectrum line
	ctx.save();
	ctx.shadowColor = '#00f5d4';
	ctx.shadowBlur = 4;
	ctx.beginPath();
	for (let i = 0; i < count; i++) {
		const x = (i / denom) * w;
		const val = Math.max(min, Math.min(max, bins[i]));
		const y = plotBottom - ((val - min) / dbRange) * plotH;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.strokeStyle = '#00f5d4';
	ctx.lineWidth = 1.8;
	ctx.stroke();
	ctx.restore();

	// Hover crosshair on spectrum canvas
	if (tooltipVisible.value && tooltipX.value >= 0 && tooltipY.value >= 0 && tooltipY.value <= plotBottom) {
		ctx.save();
		ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
		ctx.setLineDash([2, 3]);
		ctx.beginPath();
		ctx.moveTo(tooltipX.value, 0);
		ctx.lineTo(tooltipX.value, plotBottom);
		ctx.moveTo(0, tooltipY.value);
		ctx.lineTo(w, tooltipY.value);
		ctx.stroke();
		ctx.restore();
	}
}

function renderWaterfallRow(bins: Float32Array) {
	const canvas = waterfallCanvasRef.value;
	if (!canvas) return;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const w = canvas.width;
	const h = canvas.height;
	if (w <= 0 || h <= 0) return;

	const speed = waterfallSpeed.value;
	ctx.drawImage(canvas, 0, 0, w, h - speed, 0, speed, w, h - speed);

	if (!rowCanvas) {
		rowCanvas = document.createElement('canvas');
	}
	if (rowCanvas.width !== w) {
		rowCanvas.width = w;
		rowCanvas.height = 1;
		rowCtx = rowCanvas.getContext('2d');
	}
	if (!rowCtx) return;

	const rowImgData = rowCtx.createImageData(w, 1);
	const data = rowImgData.data;
	const min = minDb.value;
	const max = maxDb.value;
	const range = Math.max(1, max - min);
	const count = bins.length;

	for (let x = 0; x < w; x++) {
		const binIdx = Math.floor((x / w) * count);
		const val = bins[binIdx];
		let norm = (val - min) / range;
		if (norm < 0) norm = 0;
		if (norm > 1) norm = 1;

		const cIdx = Math.floor(norm * 255);
		const pIdx = cIdx * 3;
		const dIdx = x * 4;

		data[dIdx + 0] = paletteRgb[pIdx + 0];
		data[dIdx + 1] = paletteRgb[pIdx + 1];
		data[dIdx + 2] = paletteRgb[pIdx + 2];
		data[dIdx + 3] = 255;
	}

	rowCtx.putImageData(rowImgData, 0, 0);
	ctx.drawImage(rowCanvas, 0, 0, w, 1, 0, 0, w, speed);
}

// Mouse interaction (Hover crosshair & Click-to-Tune)
function onCanvasMouseMove(e: MouseEvent, isSpectrum: boolean) {
	const canvas = isSpectrum ? spectrumCanvasRef.value : waterfallCanvasRef.value;
	if (!canvas) return;

	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	tooltipX.value = x;
	tooltipY.value = y;
	tooltipVisible.value = true;

	const spanHz = sampleRateHz.value;
	const startHz = centerFreqHz.value - spanHz / 2.0;
	const freqAtX = startHz + (x / rect.width) * spanHz;
	const mhz = (freqAtX / 1e6).toFixed(4);

	const dbRange = Math.max(1, maxDb.value - minDb.value);
	if (isSpectrum) {
		const plotTop = 10;
		const plotBottom = rect.height - 28;
		const plotH = Math.max(1, plotBottom - plotTop);
		const clampedY = Math.max(plotTop, Math.min(plotBottom, y));
		const dbAtY = maxDb.value - ((clampedY - plotTop) / plotH) * dbRange;
		hoverDbText.value = `${dbAtY.toFixed(1)} dBFS`;
	} else {
		hoverDbText.value = '';
	}
	hoverFreqText.value = `${mhz} MHz`;
}

function onCanvasMouseLeave() {
	tooltipVisible.value = false;
	hoverFreqText.value = '';
	hoverDbText.value = '';
}

function onCanvasClick(e: MouseEvent, isSpectrum: boolean) {
	const canvas = isSpectrum ? spectrumCanvasRef.value : waterfallCanvasRef.value;
	if (!canvas) return;

	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const spanHz = sampleRateHz.value;
	const startHz = centerFreqHz.value - spanHz / 2.0;
	const clickedFreqHz = startHz + (x / rect.width) * spanHz;
	const clickedMhz = parseFloat((clickedFreqHz / 1e6).toFixed(4));
	tuneToMhz(clickedMhz);
}

// Responsive resize
function handleResize() {
	const container = document.getElementById(sdrContainerId.value);
	const targetWidth = container && container.clientWidth > 40 ? container.clientWidth - 24 : 600;
	const w = Math.max(300, targetWidth);

	if (spectrumCanvasRef.value && spectrumCanvasRef.value.width !== w) {
		spectrumCanvasRef.value.width = w;
	}
	if (waterfallCanvasRef.value && waterfallCanvasRef.value.width !== w) {
		const wfCanvas = waterfallCanvasRef.value;
		let oldCanvas: HTMLCanvasElement | null = null;
		if (wfCanvas.width > 0 && wfCanvas.height > 0) {
			oldCanvas = document.createElement('canvas');
			oldCanvas.width = wfCanvas.width;
			oldCanvas.height = wfCanvas.height;
			const oldCtx = oldCanvas.getContext('2d');
			if (oldCtx) oldCtx.drawImage(wfCanvas, 0, 0);
		}
		wfCanvas.width = w;
		const wfCtx = wfCanvas.getContext('2d');
		if (wfCtx) {
			wfCtx.fillStyle = '#06090e';
			wfCtx.fillRect(0, 0, w, wfCanvas.height);
			if (oldCanvas) {
				wfCtx.drawImage(oldCanvas, 0, 0, w, wfCanvas.height);
			}
		}
	}
}

// Continuous render loop at display refresh rate
function startRenderLoop() {
	function loop() {
		if (!isRunning) return;
		renderSpectrum();
		animFrameId = requestAnimationFrame(loop);
	}
	animFrameId = requestAnimationFrame(loop);
}

let resizeObserver: ResizeObserver | null = null;
let pollIntervalId: any = null;
let activeDataStreams: any[] = [];

async function resolveActiveDatastreamId(dsId: string, dsProps: any): Promise<string> {
	const user = dsProps.connectorOpts?.username || 'admin';
	const pass = dsProps.connectorOpts?.password || 'admin';
	const httpProto = dsProps.tls ? 'https' : 'http';
	let cleanEndpoint = (dsProps.endpointUrl || '')
		.replace(/^https?:\/\//, '')
		.replace(/^wss?:\/\//, '')
		.replace(/\/datastreams.*$/, '')
		.replace(/\/+$/, '');

	const candidatePasswords = Array.from(new Set([dsProps.connectorOpts?.password, 'admin', 'test'])).filter(Boolean) as string[];

	for (const candidatePass of candidatePasswords) {
		const authHeaders: Record<string, string> = {
			Authorization: 'Basic ' + btoa(`${user}:${candidatePass}`),
		};

		try {
			const checkRes = await fetch(`${httpProto}://${cleanEndpoint}/datastreams/${dsId}`, {
				method: 'GET',
				headers: authHeaders,
				credentials: 'include',
			});
			if (checkRes.ok) {
				if (!dsProps.connectorOpts) dsProps.connectorOpts = { username: user, password: candidatePass };
				else dsProps.connectorOpts.password = candidatePass;
				return dsId;
			}
		} catch (_) {}

		// If 404 or unreachable, auto-discover active spectrum datastream from SensorHub
		try {
			const listRes = await fetch(`${httpProto}://${cleanEndpoint}/datastreams`, {
				method: 'GET',
				headers: authHeaders,
				credentials: 'include',
			});
			if (listRes.ok) {
				const list = await listRes.json();
				const items: any[] = Array.isArray(list) ? list : (list.items || []);
				const matched = items.find((d: any) => {
					const n = (d.name || '').toLowerCase();
					const o = (d.outputName || '').toLowerCase();
					return o.includes('spectrum') || n.includes('spectrum') || o.includes('rtlsdr_spectrum');
				});
				if (matched && matched.id) {
					console.log(`[SDR.vue] Successfully auto-recovered active spectrum datastream ID: ${matched.id} (${matched.name})`);
					if (!dsProps.connectorOpts) dsProps.connectorOpts = { username: user, password: candidatePass };
					else dsProps.connectorOpts.password = candidatePass;
					return matched.id;
				}
			}
		} catch (e) {
			console.warn('[SDR.vue] Auto-discovery query error:', e);
		}
	}

	return dsId;
}

async function authenticateSession(dsId: string, dsProps: any): Promise<boolean> {
	const user = dsProps.connectorOpts?.username || 'admin';
	const pass = dsProps.connectorOpts?.password || 'admin';
	const httpProto = dsProps.tls ? 'https' : 'http';
	let cleanEndpoint = (dsProps.endpointUrl || '')
		.replace(/^https?:\/\//, '')
		.replace(/^wss?:\/\//, '')
		.replace(/\/datastreams.*$/, '')
		.replace(/\/+$/, '');

	const url = `${httpProto}://${cleanEndpoint}/datastreams/${dsId}`;
	const candidatePasswords = Array.from(new Set([dsProps.connectorOpts?.password, 'admin', 'test'])).filter(Boolean) as string[];

	for (const candidatePass of candidatePasswords) {
		try {
			console.log(`[SDR.vue] Performing preflight authentication fetch to: ${url} (user: ${user}, pass: ${candidatePass})`);
			const res = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: 'Basic ' + btoa(`${user}:${candidatePass}`),
				},
				credentials: 'include',
				mode: 'cors',
			});
			console.log('[SDR.vue] Preflight authentication result status:', res.status);
			if (res.ok) {
				if (!dsProps.connectorOpts) dsProps.connectorOpts = { username: user, password: candidatePass };
				else dsProps.connectorOpts.password = candidatePass;
				return true;
			}
			if (res.status !== 401) {
				return false;
			}
		} catch (e) {
			console.warn('[SDR.vue] Preflight authentication warning:', e);
		}
	}
	return false;
}

async function connectDirectWs(dsId: string, dsProps: any, attemptFormat?: string) {
	try {
		await authenticateSession(dsId, dsProps);

		const wsProtocol = dsProps.tls ? 'wss' : 'ws';
		let endpoint = (dsProps.endpointUrl || '')
			.replace(/^https?:\/\//, '')
			.replace(/^wss?:\/\//, '')
			.replace(/\/datastreams.*$/, '')
			.replace(/\/+$/, '');
		const format = attemptFormat || dsProps.responseFormat || 'application/om+json';
		const encodedFormat = format.replaceAll('+', '%2B');
		const directWsUrl = `${wsProtocol}://${endpoint}/datastreams/${dsId}/observations?format=${encodedFormat}`;

		console.log('[SDR.vue] Connecting direct WebSocket to:', directWsUrl);
		const ws = new WebSocket(directWsUrl);
		ws.binaryType = 'arraybuffer';

		let receivedAnyMessage = false;

		ws.onopen = () => {
			console.log('[SDR.vue] Direct WebSocket connected to:', directWsUrl);
		};

		ws.onmessage = (event) => {
			receivedAnyMessage = true;
			try {
				if (typeof event.data === 'string') {
					processIncomingText(event.data);
				} else if (event.data instanceof ArrayBuffer) {
					const text = new TextDecoder().decode(event.data);
					processIncomingText(text);
				} else if (event.data instanceof Blob) {
					event.data.text().then((t) => processIncomingText(t));
				}
			} catch (e) {
				console.warn('[SDR.vue] Direct WS frame parse warning:', e);
			}
		};

		ws.onerror = (e) => {
			console.warn('[SDR.vue] Direct WS error for ' + dsId + ' (' + format + '):', e);
		};

		ws.onclose = (e) => {
			console.log('[SDR.vue] Direct WS closed for ' + dsId + ' (' + format + ') code=' + e.code + ', reason=' + e.reason);
			if (!receivedAnyMessage && isRunning) {
				if (format.includes('om+json')) {
					console.log('[SDR.vue] Retrying direct WS with application/swe+json for ' + dsId);
					setTimeout(() => {
						if (isRunning) connectDirectWs(dsId, dsProps, 'application/swe+json');
					}, 800);
				} else if (format.includes('swe+json')) {
					console.log('[SDR.vue] Retrying direct WS with text/csv for ' + dsId);
					setTimeout(() => {
						if (isRunning) connectDirectWs(dsId, dsProps, 'text/csv');
					}, 800);
				}
			}
		};

		directWebSockets.push(ws);
	} catch (wsErr) {
		console.warn('[SDR.vue] Direct WebSocket creation failed:', wsErr);
	}
}

function connectDataStream(dsId: string, dsProps: any) {
	try {
		let endpoint = (dsProps.endpointUrl || '')
			.replace(/^https?:\/\//, '')
			.replace(/^wss?:\/\//, '')
			.replace(/\/datastreams.*$/, '')
			.replace(/\/+$/, '');

		const networkProperties = {
			endpointUrl: endpoint,
			tls: dsProps.tls ?? false,
			connectorOpts: dsProps.connectorOpts ?? { username: '', password: '' },
		};

		const ds = new DataStream({ id: dsId }, networkProperties);
		activeDataStreams.push(ds);

		const format = dsProps.responseFormat || 'application/om+json';
		ds.streamObservations(new ObservationFilter({ format }), (dataBlock: any) => {
			if (Array.isArray(dataBlock)) {
				for (const item of dataBlock) {
					handleObservationData(item.data ?? item);
				}
			} else if (dataBlock) {
				handleObservationData(dataBlock.data ?? dataBlock);
			}
		});
		console.log('[SDR.vue] DataStream.streamObservations initiated for:', dsId, format);
	} catch (err) {
		console.warn('[SDR.vue] DataStream.streamObservations connection error:', err);
	}
}

function startPollingFallback() {
	if (pollIntervalId) return;
	pollIntervalId = setInterval(async () => {
		if (isPaused.value) return;
		// Only skip poll if high-speed stream is actively delivering frames
		if (fps.value >= 2) return;

		for (const dsProps of props.datasource) {
			const resourceMatch = (dsProps.resource || '').match(/\/datastreams\/([^/?#]+)/);
			const initialDsId = (dsProps as any).datastreamId || (resourceMatch ? resourceMatch[1] : dsProps.id);
			const activeDsId = await resolveActiveDatastreamId(initialDsId, dsProps);
			try {
				const latest = await getLatestObservation({
					id: dsProps.id,
					datastreamId: activeDsId,
					resource: `/datastreams/${activeDsId}`,
					endpointUrl: dsProps.endpointUrl,
					tls: dsProps.tls,
					connectorOpts: dsProps.connectorOpts,
				});
				if (latest) {
					const record = latest.data ?? latest;
					handleObservationData(record);
				}
			} catch (_) {}
		}
	}, 1000);
}

async function detectHtlConnection() {
	const dsList = getDatasourceList();
	const cs = receiverControl.value.id ? controlstreamStore.getControlStreamsById([receiverControl.value.id])[0] : null;

	// 1. Check controlstream name or id
	const csName = (cs?.name || cs?.controlstream?.properties?.name || props.controlstream?.name || '').toLowerCase();
	const csId = (receiverControl.value.id || props.controlstream?.id || '').toLowerCase();
	const isCsHtl = csName.includes('htl') || csId.includes('htl');

	// 2. Check datasource resources or names
	const isDsHtl = dsList.some((d: any) => {
		const n = (d.name || '').toLowerCase();
		const r = (d.resource || '').toLowerCase();
		return n.includes('htl') || r.includes('htl');
	});

	if (isCsHtl || isDsHtl) {
		isHtlDriver.value = true;
	}

	// 3. Inspect datastreams from SensorHub to determine connection mode (1GbE vs 10GbE vs BOTH)
	for (const dsProps of dsList) {
		const user = dsProps.connectorOpts?.username || 'admin';
		const pass = dsProps.connectorOpts?.password || 'admin';
		const httpProto = dsProps.tls ? 'https' : 'http';
		let cleanEndpoint = (dsProps.endpointUrl || '')
			.replace(/^https?:\/\//, '')
			.replace(/^wss?:\/\//, '')
			.replace(/\/datastreams.*$/, '')
			.replace(/\/+$/, '');

		if (!cleanEndpoint) continue;

		try {
			const res = await fetch(`${httpProto}://${cleanEndpoint}/datastreams`, {
				headers: { Authorization: 'Basic ' + btoa(`${user}:${pass}`) },
				credentials: 'include',
			});
			if (res.ok) {
				const list = await res.json();
				const items: any[] = Array.isArray(list) ? list : (list.items || []);
				const htlItems = items.filter((d: any) => {
					const n = (d.name || '').toLowerCase();
					const o = (d.outputName || '').toLowerCase();
					return n.includes('htl') || o.includes('spectrum') || o.includes('tunerstatus') || o.startsWith('iq');
				});

				if (htlItems.length > 0) {
					isHtlDriver.value = true;
					const hasSpectrum = htlItems.some((d: any) => {
						const o = (d.outputName || '').toLowerCase();
						const n = (d.name || '').toLowerCase();
						return o === 'spectrum' || n.includes('spectrum');
					});
					const hasDdc = htlItems.some((d: any) => {
						const o = (d.outputName || '').toLowerCase();
						return o === 'tunerstatus' || o === 'collectorstatus' || o.startsWith('iq');
					});

					if (hasSpectrum && hasDdc) {
						connectionMode.value = 'BOTH';
					} else if (hasSpectrum) {
						connectionMode.value = '1GbE';
					} else if (hasDdc) {
						connectionMode.value = '10GbE';
					}

					// Auto-discover and connect audio datastream if available
					const audioItem = items.find((d: any) => {
						const o = (d.outputName || '').toLowerCase();
						const n = (d.name || '').toLowerCase();
						return o === 'audio' || n.includes('audio');
					});
					if (audioItem && audioItem.id && !audioDsConnected) {
						const alreadyHasAudio = dsList.some((d: any) => (d.resource || '').includes(audioItem.id));
						if (!alreadyHasAudio) {
							audioDsConnected = true;
							console.log(`[SDR.vue] Auto-subscribing to audio datastream: ${audioItem.id} (${audioItem.name})`);
							connectDirectWs(audioItem.id, dsProps);
							connectDataStream(audioItem.id, dsProps);
						}
					}
					return;
				}
			}
		} catch (e) {
			console.warn('[SDR.vue] Error detecting HTL connection mode:', e);
		}
	}

	// Fallback based on swept spectrum status
	if (isHtlDriver.value && connectionMode.value === 'UNKNOWN') {
		if (hasStartStopActive.value) {
			connectionMode.value = '1GbE';
		}
	}
}

onMounted(() => {
	isRunning = true;
	initPalette(colorPalette.value);

	handleResize();
	initWaterfallCanvas();
	startRenderLoop();
<<<<<<< HEAD
	detectHtlConnection();
=======
	connectAudioStream();
>>>>>>> 2be0f592220eaaef39cc15ff2ff6a89387485912

	setTimeout(() => {
		handleResize();
		initWaterfallCanvas();
	}, 60);

	setTimeout(() => {
		handleResize();
	}, 200);

	// Setup datasources, direct WebSockets, and BroadcastChannels
	for (const dsProps of props.datasource) {
		const resourceMatch = (dsProps.resource || '').match(/\/datastreams\/([^/?#]+)/);
		const initialDsId = (dsProps as any).datastreamId || (resourceMatch ? resourceMatch[1] : dsProps.id);

		// Resolve active datastream ID (auto-healing 404s if node restarted)
		resolveActiveDatastreamId(initialDsId, dsProps).then(async (activeDsId) => {
			if (!isRunning) return;
			console.log('[SDR.vue] Resolved active datastream ID:', activeDsId);

			await authenticateSession(activeDsId, dsProps);
			connectDirectWs(activeDsId, dsProps);
			connectDataStream(activeDsId, dsProps);

			// Query latest observation from active datastream
			getLatestObservation({
				id: dsProps.id,
				datastreamId: activeDsId,
				resource: `/datastreams/${activeDsId}`,
				endpointUrl: dsProps.endpointUrl,
				tls: dsProps.tls,
				connectorOpts: dsProps.connectorOpts,
			})
				.then((latest) => {
					if (latest) {
						console.log('[SDR.vue] Latest observation fetched on mount:', latest);
						const record = latest.data ?? latest;
						handleObservationData(record);
					}
				})
				.catch((err) => {
					console.warn('[SDR.vue] Could not fetch latest observation:', err);
				});
		});

		const dsInstance = createDatasource(dsProps);
		dsInstance.connect();
		dsInstances.value.push(dsInstance);

		// Synchronous fallback candidate IDs for BroadcastChannel
		const realtimeId = (dsInstance as any).timeSeriesRealtimeDataSource?.id;
		const candidateIds = new Set<string>();
		if (realtimeId) candidateIds.add(realtimeId);
		if ((dsInstance as any).id) candidateIds.add((dsInstance as any).id);
		if (dsProps.id) candidateIds.add(dsProps.id);

		for (const candidateId of candidateIds) {
			const topic = DATASOURCE_DATA_TOPIC + candidateId;
			const bc = new BroadcastChannel(topic);
			bc.onmessage = (event) => {
				if (event.data?.type === 'data') {
					const values = event.data.values;
					if (values && values.length > 0) {
						for (const item of values) {
							handleObservationData(item.data ?? item);
						}
					}
				}
			};
			broadcastChannels.push(bc);
		}

		// Await async init for datasource topic and subscription
		(async () => {
			try {
				await (dsInstance as any).checkInit?.();
				const dynId = (dsInstance as any).getId?.() || (dsInstance as any).id;
				if (dynId && !candidateIds.has(dynId)) {
					candidateIds.add(dynId);
					const bc = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dynId);
					bc.onmessage = (event) => {
						if (event.data?.type === 'data' && event.data.values?.length) {
							for (const item of event.data.values) {
								handleObservationData(item.data ?? item);
							}
						}
					};
					broadcastChannels.push(bc);
				}

				(dsInstance as any).subscribe?.((eventData: any) => {
					if (eventData?.values && eventData.values.length > 0) {
						for (const item of eventData.values) {
							handleObservationData(item.data ?? item);
						}
					}
				}, ['data']);
			} catch (_) {}
		})();
	}

	// 3. Fallback poller with throttled 5s interval to ensure active updates even if WebSockets are slow or blocked
	startPollingFallback();

	// Resize handling
	const container = document.getElementById(sdrContainerId.value);
	if (container) {
		resizeObserver = new ResizeObserver(() => handleResize());
		resizeObserver.observe(container);
	}
});

onUnmounted(() => {
	isRunning = false;
	if (animFrameId) cancelAnimationFrame(animFrameId);
	if (pollIntervalId) {
		clearInterval(pollIntervalId);
		pollIntervalId = null;
	}
	if (audioReconnectTimer) {
		clearTimeout(audioReconnectTimer);
		audioReconnectTimer = null;
	}
	if (audioWs) {
		try {
			audioWs.close();
		} catch (_) {}
		audioWs = null;
	}
	if (audioCtx) {
		try {
			audioCtx.close();
		} catch (_) {}
		audioCtx = null;
	}
	for (const bc of broadcastChannels) {
		bc.close();
	}
	broadcastChannels = [];
	for (const ws of directWebSockets) {
		try {
			ws.close();
		} catch (ignored) {}
	}
	directWebSockets = [];
	for (const ds of activeDataStreams) {
		try {
			ds.stream?.()?.disconnect?.();
		} catch (_) {}
	}
	activeDataStreams = [];
	if (resizeObserver) {
		resizeObserver.disconnect();
	}
	if (audioCtx) {
		try {
			audioCtx.close();
		} catch (_) {}
		audioCtx = null;
	}
	if (recordingTimerId) {
		clearInterval(recordingTimerId);
		recordingTimerId = null;
	}
});

useVisualizationCleanup(ref(dsInstances));
</script>

<template>
	<v-card
		:id="sdrContainerId"
		class="sdr-card pa-3 mb-2"
		elevation="3"
	>
		<!-- SDR Header / Status Bar -->
		<div class="sdr-header mb-2">
			<div class="sdr-status-group">
				<span
					class="sdr-pulse"
					:class="isPaused ? 'paused' : isLive ? 'live' : 'waiting'"
				></span>
				<span class="sdr-status-title">
					{{ isPaused ? 'PAUSED' : isLive ? 'LIVE' : 'CONNECTING' }}
				</span>
				<span class="sdr-freq-badge">{{ (centerFreqHz / 1e6).toFixed(3) }} MHz</span>
				<span class="sdr-span-badge">Span: {{ (sampleRateHz / 1e6).toFixed(2) }} MHz</span>

				<v-chip
					size="x-small"
					color="primary"
					variant="flat"
					class="ml-1 font-weight-bold"
				>
					{{ operatingMode.replace('_', ' ') }}
				</v-chip>

				<v-chip
					v-if="isHtlDriver"
					size="x-small"
					:color="connectionModeColor"
					variant="flat"
					class="ml-1 font-weight-bold"
				>
					{{ connectionModeLabel }}
				</v-chip>
			</div>

			<div class="sdr-status-group">
				<v-chip
					size="small"
					color="warning"
					variant="tonal"
					class="font-monospace"
				>
					Peak: {{ peakFreqMhz }} MHz ({{ peakDbVal }} dB)
				</v-chip>
				<span class="sdr-fps-badge">{{ fps }} fps</span>
			</div>
		</div>

		<!-- Main Tuning & Control Bar -->
		<div class="sdr-controls-bar mb-2">
			<div class="sdr-group">
				<v-text-field
					v-model="tuneMhzDisplay"
					label="Center (MHz)"
					class="sdr-tune-input"
					density="compact"
					variant="outlined"
					hide-details
					placeholder="0000.000"
					@focus="onTuneFocus"
					@blur="onTuneBlur"
					@keydown.enter="applyTuneInput"
				></v-text-field>

				<v-btn
					size="small"
					color="primary"
					variant="flat"
					@click="applyTuneInput"
				>
					Tune
				</v-btn>

				<v-btn-group
					density="compact"
					variant="outlined"
				>
					<v-btn
						size="x-small"
						@click="stepFreq(-1.0)"
						title="Down 1 MHz"
					>
						-1M
					</v-btn>
					<v-btn
						size="x-small"
						@click="stepFreq(-0.1)"
						title="Down 100 kHz"
					>
						-100k
					</v-btn>
					<v-btn
						size="x-small"
						@click="stepFreq(0.1)"
						title="Up 100 kHz"
					>
						+100k
					</v-btn>
					<v-btn
						size="x-small"
						@click="stepFreq(1.0)"
						title="Up 1 MHz"
					>
						+1M
					</v-btn>
				</v-btn-group>
			</div>

			<div class="sdr-group">
				<v-btn
					v-if="isHtlDriver"
					size="small"
					:color="showHtlControls ? 'primary' : 'grey-darken-3'"
					variant="flat"
					@click="showHtlControls = !showHtlControls"
					title="Toggle HTL Controls Panel"
				>
					HTL Controls
					<v-icon end size="small">{{ showHtlControls ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
				</v-btn>

				<v-btn
					size="small"
					:color="autoDb ? 'primary' : 'grey-darken-3'"
					variant="flat"
					@click="autoDb = !autoDb"
					title="Automatically scale dB floor and ceiling"
				>
					Auto dB
				</v-btn>

				<v-btn
					size="small"
					:color="isPaused ? 'warning' : 'grey-darken-3'"
					variant="flat"
					@click="isPaused = !isPaused"
				>
					{{ isPaused ? 'Resume' : 'Pause' }}
				</v-btn>

				<v-btn
					size="small"
					:color="showWaterfall ? 'info' : 'grey-darken-3'"
					variant="outlined"
					@click="showWaterfall = !showWaterfall"
				>
					Waterfall
				</v-btn>
			</div>
		</div>

		<!-- HTL Expanded Controls Panel -->
		<div
			v-if="isHtlDriver && showHtlControls"
			class="htl-panel pa-3 mb-2"
		>
			<div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-2">
				<div class="d-flex align-center ga-2">
					<span class="htl-title">HTL RADIO CONTROLS</span>
					<v-chip
						size="x-small"
						:color="connectionModeColor"
						variant="outlined"
						class="font-weight-bold"
					>
						{{ connectionModeLabel }}
					</v-chip>
				</div>

				<div class="d-flex align-center ga-2 flex-wrap">
					<v-btn
						size="x-small"
						color="info"
						variant="tonal"
						@click="applyHtlRefreshStatus"
						title="Publish latest core unit status"
					>
						Refresh Status
					</v-btn>
					<v-btn
						size="x-small"
						color="warning"
						variant="tonal"
						@click="showResetDialog = true"
						title="Reset tuners and collectors to factory defaults"
					>
						Reset Unit
					</v-btn>
					<v-btn
						size="x-small"
						color="error"
						variant="flat"
						@click="showRebootDialog = true"
						title="Reboot HTL radio unit"
					>
						Reboot Radio
					</v-btn>
				</div>
			</div>

			<!-- Section 1: 1 GbE & Both - Sweep & Scanner Range Configuration -->
			<div class="htl-section mb-3">
				<div class="htl-section-header">
					<span class="htl-section-title">SPECTRUM SCANNER CONFIGURATION</span>
					<span v-if="!is1GbeCapable" class="text-caption text-error font-italic">
						(Requires 1 GbE connection)
					</span>
				</div>
				<div class="d-flex flex-wrap align-center ga-2 mt-1">
					<v-text-field
						v-model.number="htlStartFreqMhz"
						label="Start (MHz)"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 130px;"
						type="number"
						step="1.0"
						:disabled="!is1GbeCapable"
					></v-text-field>

					<v-text-field
						v-model.number="htlStopFreqMhz"
						label="Stop (MHz)"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 130px;"
						type="number"
						step="1.0"
						:disabled="!is1GbeCapable"
					></v-text-field>

					<v-select
						v-model="htlNumPoints"
						:items="[512, 1024, 2048, 4096, 8192]"
						label="FFT Bins"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 110px;"
						:disabled="!is1GbeCapable"
					></v-select>

					<v-select
						v-model="htlUpdateRate"
						:items="[1, 2, 5, 10, 15, 20, 25, 30]"
						label="Rate (Hz)"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 100px;"
						:disabled="!is1GbeCapable"
					></v-select>

					<v-btn
						size="small"
						color="primary"
						variant="flat"
						@click="applyHtlSpectrumConfig"
						:disabled="!is1GbeCapable"
					>
						Apply Sweep
					</v-btn>
				</div>
			</div>

			<!-- Section 2: 1 GbE & Both - Signal Scout & Audio Demodulation -->
			<div class="htl-section mb-3">
				<div class="htl-section-header">
					<div class="d-flex align-center ga-2 flex-wrap">
						<span class="htl-section-title">SIGNAL SCOUT & AUDIO DEMODULATION</span>
						<v-chip
							v-if="isAudioConnected"
							size="x-small"
							color="success"
							variant="flat"
							class="font-weight-medium"
						>
							AUDIO: {{ Math.round(audioSampleRate / 1000) }} kHz {{ audioChannels === 1 ? 'Mono' : 'Stereo' }}
						</v-chip>
						<v-chip
							v-if="isRecordingAudio"
							size="x-small"
							color="error"
							variant="flat"
							class="font-weight-bold"
						>
							● REC {{ formattedRecordingTime }}
						</v-chip>
					</div>
					<span v-if="!is1GbeCapable" class="text-caption text-error font-italic">
						(Requires 1 GbE connection)
					</span>
				</div>
				<div class="d-flex flex-wrap align-center ga-2 mt-1">
					<v-select
						v-model="htlScoutId"
						:items="[0, 1, 2, 3]"
						label="Scout ID"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 100px;"
						:disabled="!is1GbeCapable"
					></v-select>

					<v-text-field
						v-model.number="htlScoutFreqMhz"
						label="Scout Freq (MHz)"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 140px;"
						type="number"
						step="0.025"
						:disabled="!is1GbeCapable"
					></v-text-field>

					<v-btn
						size="x-small"
						variant="tonal"
						color="info"
						@click="htlScoutFreqMhz = parseFloat(peakFreqMhz)"
						:disabled="!is1GbeCapable || peakFreqMhz === '---'"
						title="Set scout frequency to detected peak frequency"
					>
						Set Peak
					</v-btn>

					<v-select
						v-model="htlDemodMode"
						:items="['FM', 'WFM', 'AM', 'USB', 'LSB', 'CW']"
						label="Demod"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 110px;"
						:disabled="!is1GbeCapable"
					></v-select>

					<div class="d-flex align-center ga-1" style="min-width: 170px; max-width: 210px; flex: 1 1 170px;">
						<span class="text-caption text-grey font-weight-medium" style="white-space: nowrap;">SQL:</span>
						<v-slider
							v-model="htlSquelch"
							:min="-120"
							:max="0"
							:step="1"
							density="compact"
							hide-details
							color="primary"
							class="flex-grow-1 mx-1"
							:disabled="!is1GbeCapable"
						></v-slider>
						<span class="text-caption font-monospace text-right" style="min-width: 45px;">{{ htlSquelch }}dB</span>
					</div>

					<div class="d-flex align-center ga-1" style="min-width: 150px; max-width: 190px; flex: 1 1 150px;">
						<span class="text-caption text-grey font-weight-medium" style="white-space: nowrap;">VOL:</span>
						<v-slider
							v-model="htlVolume"
							:min="0"
							:max="100"
							:step="5"
							density="compact"
							hide-details
							color="primary"
							class="flex-grow-1 mx-1"
							:disabled="!is1GbeCapable"
							@update:model-value="onVolumeChanged"
						></v-slider>
						<span class="text-caption font-monospace text-right" style="min-width: 35px;">{{ htlVolume }}%</span>
					</div>

					<v-btn
						size="small"
						:color="isAudioListening ? 'success' : 'grey-darken-2'"
						:variant="isAudioListening ? 'flat' : 'tonal'"
						@click="toggleAudioListening"
						:disabled="!is1GbeCapable"
						:prepend-icon="isAudioListening ? 'mdi-volume-high' : 'mdi-volume-off'"
						:title="isAudioListening ? 'Mute demodulated audio' : 'Listen to demodulated audio in browser'"
					>
						{{ isAudioListening ? 'Listening' : 'Listen' }}
					</v-btn>

					<v-btn
						size="small"
						:color="isRecordingAudio ? 'error' : 'grey-darken-2'"
						:variant="isRecordingAudio ? 'flat' : 'tonal'"
						@click="toggleAudioRecording"
						:disabled="!is1GbeCapable || !receiverControl.hasControl"
						:prepend-icon="isRecordingAudio ? 'mdi-record-rec' : 'mdi-record'"
						:title="isRecordingAudio ? 'Stop recording audio' : 'Record scout audio to WAV file on driver'"
					>
						{{ isRecordingAudio ? 'Stop Rec' : 'Record' }}
					</v-btn>

					<v-btn
						size="small"
						color="primary"
						variant="flat"
						@click="applyHtlScout"
						:disabled="!is1GbeCapable"
					>
						Apply Scout
					</v-btn>
				</div>

				<!-- Live Audio Level Meter & Status Bar -->
				<div
					v-if="isAudioConnected"
					class="d-flex align-center ga-2 mt-2 px-2 py-1 rounded bg-grey-darken-4 text-caption"
					style="font-size: 0.75rem;"
				>
					<span class="text-grey">Audio Level:</span>
					<div
						class="flex-grow-1 rounded overflow-hidden position-relative bg-grey-darken-3"
						style="height: 10px; max-width: 250px;"
					>
						<div
							class="h-100 transition-swing"
							:class="isAudioGateOpen ? 'bg-success' : 'bg-warning'"
							:style="{ width: `${Math.max(0, Math.min(100, (audioLevelDbfs + 100) * 1.25))}%` }"
						></div>
					</div>
					<span class="font-monospace text-grey-lighten-1" style="min-width: 45px;">{{ audioLevelDbfs }} dBFS</span>
					<v-chip
						size="x-small"
						:color="isAudioGateOpen ? 'success' : 'grey'"
						variant="tonal"
						class="text-uppercase"
					>
						{{ isAudioGateOpen ? 'Gate Open' : 'Squelched' }}
					</v-chip>
				</div>
			</div>

			<!-- Section 3: 10 GbE & Both - DDC Tuner & Collector Tasking -->
			<div class="htl-section mb-3" :class="{ 'htl-section-disabled': !is10GbeCapable }">
				<div class="htl-section-header">
					<span class="htl-section-title">10 GbE DDC TUNER & COLLECTOR TASKING</span>
					<span v-if="!is10GbeCapable" class="text-caption text-warning font-italic">
						(Disabled: requires 10 GbE connection, current mode is {{ connectionModeLabel }})
					</span>
				</div>
				<div class="d-flex flex-wrap align-center ga-2 mt-1">
					<v-select
						v-model="htlTunerId"
						:items="[0, 1]"
						label="Tuner"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 90px;"
						:disabled="!is10GbeCapable"
					></v-select>

					<v-select
						v-model="htlTunerMode"
						:items="['AutoTune', 'ManualTune']"
						label="Tune Mode"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 130px;"
						:disabled="!is10GbeCapable"
					></v-select>

					<v-text-field
						v-model.number="htlTunerFreqMhz"
						label="Tuner (MHz)"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 130px;"
						type="number"
						step="0.1"
						:disabled="!is10GbeCapable"
					></v-text-field>

					<v-select
						v-model="htlTxRxMode"
						:items="['Rx', 'Tx', 'FullDuplex']"
						label="Tx/Rx"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 100px;"
						:disabled="!is10GbeCapable"
					></v-select>

					<v-checkbox
						v-model="htlTunerAgc"
						label="AGC"
						density="compact"
						hide-details
						:disabled="!is10GbeCapable"
						class="ma-0"
					></v-checkbox>

					<v-checkbox
						v-model="htlTunerPreamp"
						label="Preamp"
						density="compact"
						hide-details
						:disabled="!is10GbeCapable"
						class="ma-0"
					></v-checkbox>

					<v-btn
						size="small"
						color="secondary"
						variant="flat"
						@click="applyHtlTuner()"
						:disabled="!is10GbeCapable"
					>
						Apply Tuner
					</v-btn>

					<!-- Collector Controls -->
					<v-divider vertical class="mx-1 my-1"></v-divider>

					<v-select
						v-model="htlCollectorSlot"
						:items="['iq0', 'iq1']"
						label="IQ Slot"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 95px;"
						:disabled="!is10GbeCapable"
					></v-select>

					<v-select
						v-model="htlCollectorBwMhz"
						:items="[0.5, 1.0, 2.0, 5.0, 10.0, 20.0]"
						label="BW (MHz)"
						density="compact"
						variant="outlined"
						hide-details
						style="width: 105px;"
						:disabled="!is10GbeCapable"
					></v-select>

					<v-btn
						size="small"
						color="success"
						variant="flat"
						@click="applyHtlCollectorStart"
						:disabled="!is10GbeCapable"
					>
						Start Collect
					</v-btn>

					<v-btn
						size="small"
						color="error"
						variant="outlined"
						@click="applyHtlCollectorStop"
						:disabled="!is10GbeCapable"
					>
						Stop
					</v-btn>

					<v-btn
						size="small"
						color="warning"
						variant="outlined"
						@click="applyHtlHalt"
						:disabled="!is10GbeCapable"
					>
						Halt All
					</v-btn>
				</div>
			</div>

			<!-- Section 4: Format Service Management -->
			<div class="d-flex align-center ga-2 mt-2 pt-2 border-t">
				<span class="text-caption text-grey">Format Service:</span>
				<v-select
					v-model="htlServiceName"
					:items="['DDC', 'HSTA']"
					density="compact"
					variant="outlined"
					hide-details
					style="width: 110px;"
				></v-select>
				<v-btn
					size="x-small"
					color="info"
					variant="flat"
					@click="applyHtlStartService"
				>
					Start Service
				</v-btn>
			</div>
		</div>

		<!-- Optional Receiver Hardware Control Bar (if controlstream bound and non-HTL) -->
		<div
			v-if="receiverControl.hasControl && !isHtlDriver"
			class="sdr-rx-controls mb-2 pa-2"
		>
			<span class="sdr-sublabel mr-2">RECEIVER:</span>

			<div
				class="d-flex align-center mr-2"
				style="width: 170px;"
			>
				<v-select
					v-model="operatingMode"
					:items="[
						{ title: 'Spectrum / Audio', value: 'SPECTRUM_AUDIO' },
						{ title: '1090 MHz ADS-B', value: 'ADSB_RECEIVER' },
						{ title: '162 MHz AIS', value: 'AIS_RECEIVER' },
					]"
					density="compact"
					label="Mode"
					variant="outlined"
					hide-details
					@update:model-value="applyOperatingMode"
				></v-select>
			</div>

			<v-btn
				size="x-small"
				:color="autoGain ? 'primary' : 'grey-darken-2'"
				variant="flat"
				@click="toggleAutoGain"
				class="mr-2"
			>
				Auto Gain
			</v-btn>

			<div
				v-if="!autoGain"
				class="d-flex align-center mr-3"
				style="width: 140px;"
			>
				<span class="text-caption mr-1">{{ gainVal }}dB</span>
				<v-slider
					v-model="gainVal"
					:min="0"
					:max="49.6"
					:step="1.0"
					density="compact"
					hide-details
					@end="applyGain"
				></v-slider>
			</div>

			<div
				class="d-flex align-center mr-2"
				style="width: 155px;"
			>
				<v-select
					v-model="audioMode"
					:items="['OFF', 'WFM', 'WFM_STEREO', 'NFM', 'AM', 'USB', 'LSB', 'CW']"
					density="compact"
					label="Demod"
					variant="outlined"
					hide-details
					@update:model-value="applyAudioMode"
				></v-select>
			</div>

<<<<<<< HEAD
			<v-btn
				v-if="audioMode !== 'OFF'"
				size="x-small"
				:color="isAudioListening ? 'success' : 'grey-darken-2'"
				:variant="isAudioListening ? 'flat' : 'tonal'"
				@click="toggleAudioListening"
				class="ml-2"
				:prepend-icon="isAudioListening ? 'mdi-volume-high' : 'mdi-volume-off'"
				:title="isAudioListening ? 'Mute audio' : 'Listen to demodulated audio in browser'"
			>
				{{ isAudioListening ? 'Listening' : 'Listen' }}
=======
			<!-- Audio Listen / Mute Toggle -->
			<v-btn
				size="x-small"
				:color="isListening ? 'success' : 'grey-darken-2'"
				:variant="isListening ? 'flat' : 'outlined'"
				@click="toggleAudioListen"
				class="mr-2"
				:prepend-icon="isListening ? 'mdi-volume-high' : 'mdi-volume-mute'"
			>
				{{ isListening ? 'Listen' : 'Muted' }}
			</v-btn>

			<!-- Volume Slider (shown when listening) -->
			<div
				v-if="isListening"
				class="d-flex align-center mr-2"
				style="width: 100px;"
			>
				<v-slider
					v-model="audioVolume"
					:min="0"
					:max="100"
					:step="1"
					density="compact"
					hide-details
					@update:model-value="onVolumeChange"
				></v-slider>
			</div>

			<!-- Audio Record Toggle -->
			<v-btn
				size="x-small"
				:color="isRecordingAudio ? 'error' : 'grey-darken-2'"
				:variant="isRecordingAudio ? 'flat' : 'outlined'"
				@click="toggleAudioRecord"
				class="mr-2"
				:prepend-icon="isRecordingAudio ? 'mdi-record-rec' : 'mdi-record'"
			>
				{{ isRecordingAudio ? 'Recording' : 'Record' }}
>>>>>>> 2be0f592220eaaef39cc15ff2ff6a89387485912
			</v-btn>
		</div>

		<!-- Upper Canvas: RF Spectrum Analyzer -->
		<div class="sdr-canvas-wrapper">
			<div class="sdr-canvas-header">
				<span class="sdr-canvas-title">RF Spectrum Analyzer (Amplitude vs Frequency)</span>
				<span
					v-if="hoverFreqText"
					class="sdr-hover-readout"
				>
					{{ hoverFreqText }} {{ hoverDbText ? ` | ${hoverDbText}` : '' }}
				</span>
			</div>
			<canvas
				ref="spectrumCanvasRef"
				class="sdr-canvas"
				height="215"
				@mousemove="onCanvasMouseMove($event, true)"
				@mouseleave="onCanvasMouseLeave"
				@click="onCanvasClick($event, true)"
			></canvas>
		</div>

		<!-- Lower Canvas: Waterfall Spectrogram -->
		<div
			v-if="showWaterfall"
			class="sdr-canvas-wrapper mt-2"
		>
			<div class="sdr-canvas-header">
				<span class="sdr-canvas-title">Waterfall Spectrogram (History vs Frequency)</span>
				<div class="d-flex align-center ga-1">
					<span class="text-caption text-grey">{{ minDb }} dB</span>
					<div class="sdr-legend-gradient"></div>
					<span class="text-caption text-grey">{{ maxDb }} dB</span>
				</div>
			</div>
			<canvas
				ref="waterfallCanvasRef"
				class="sdr-canvas"
				height="160"
				@mousemove="onCanvasMouseMove($event, false)"
				@mouseleave="onCanvasMouseLeave"
				@click="onCanvasClick($event, false)"
			></canvas>
		</div>

		<!-- Confirmation Dialogs -->
		<v-dialog v-model="showRebootDialog" max-width="420">
			<v-card color="#111a24" class="pa-3">
				<v-card-title class="text-error font-weight-bold">
					Confirm Radio Reboot
				</v-card-title>
				<v-card-text>
					Are you sure you want to reboot the HTL Radio unit? All active streams and connections will temporarily disconnect while the unit restarts.
				</v-card-text>
				<v-card-actions class="justify-end ga-2">
					<v-btn variant="text" @click="showRebootDialog = false">Cancel</v-btn>
					<v-btn color="error" variant="flat" @click="confirmHtlReboot">Reboot</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="showResetDialog" max-width="420">
			<v-card color="#111a24" class="pa-3">
				<v-card-title class="text-warning font-weight-bold">
					Confirm Unit Reset
				</v-card-title>
				<v-card-text>
					Are you sure you want to reset all tuners and collectors to factory defaults?
				</v-card-text>
				<v-card-actions class="justify-end ga-2">
					<v-btn variant="text" @click="showResetDialog = false">Cancel</v-btn>
					<v-btn color="warning" variant="flat" @click="confirmHtlReset">Reset</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-card>
</template>

<style scoped>
.sdr-card {
	background: #0a0f16;
	color: #e2e8f0;
	border: 1px solid #1e293b;
	border-radius: 8px;
	user-select: none;
}

.sdr-header,
.sdr-controls-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.sdr-status-group,
.sdr-group {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
}

.sdr-status-title {
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.5px;
}

.sdr-pulse {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	display: inline-block;
}
.sdr-pulse.live {
	background: #22c55e;
	box-shadow: 0 0 6px #22c55e;
}
.sdr-pulse.paused {
	background: #f59e0b;
	box-shadow: 0 0 6px #f59e0b;
}
.sdr-pulse.waiting {
	background: #ef4444;
	box-shadow: 0 0 6px #ef4444;
}

.sdr-freq-badge {
	font-family: Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: #38bdf8;
	background: #0f172a;
	padding: 2px 8px;
	border-radius: 4px;
	border: 1px solid #1e293b;
}

.sdr-span-badge {
	font-size: 11px;
	color: #94a3b8;
	font-family: Consolas, monospace;
}

.sdr-fps-badge {
	font-size: 11px;
	color: #64748b;
	font-family: monospace;
}

.sdr-rx-controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	background: #111a24;
	border: 1px solid #1e293b;
	border-radius: 6px;
}

.sdr-sublabel {
	font-size: 10px;
	font-weight: 700;
	color: #38bdf8;
	letter-spacing: 0.5px;
}

.sdr-tune-input {
	width: 175px;
	min-width: 160px;
}

.sdr-tune-input :deep(input) {
	font-family: Consolas, 'Courier New', monospace;
	font-weight: 600;
	font-size: 14px;
	letter-spacing: 0.5px;
	text-align: right;
	padding-right: 8px;
}

.sdr-canvas-wrapper {
	position: relative;
	width: 100%;
}

.sdr-canvas-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 11px;
	font-weight: 600;
	color: #94a3b8;
	margin-bottom: 2px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.sdr-canvas-title {
	color: #38bdf8;
}

.sdr-hover-readout {
	font-family: Consolas, monospace;
	color: #facc15;
	font-size: 11px;
}

.sdr-canvas {
	width: 100%;
	display: block;
	background: #06090e;
	border: 1px solid #1e293b;
	border-radius: 4px;
	cursor: crosshair;
}

.sdr-legend-gradient {
	width: 80px;
	height: 8px;
	border-radius: 2px;
	background: linear-gradient(
		to right,
		#0a0f28,
		#0022cc,
		#00cccc,
		#66dd00,
		#ffcc00,
		#ff2200,
		#ffffff
	);
	border: 1px solid #334155;
}

.htl-panel {
	background: #0d1520;
	border: 1px solid #1e2d42;
	border-radius: 6px;
}

.htl-title {
	font-size: 11px;
	font-weight: 700;
	color: #38bdf8;
	letter-spacing: 0.5px;
}

.htl-section {
	background: #111a26;
	border: 1px solid #1b2636;
	border-radius: 4px;
	padding: 8px;
}

.htl-section-disabled {
	opacity: 0.55;
	background: #0d131c;
}

.htl-section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 4px;
}

.htl-section-title {
	font-size: 10px;
	font-weight: 700;
	color: #94a3b8;
	letter-spacing: 0.5px;
}
</style>
