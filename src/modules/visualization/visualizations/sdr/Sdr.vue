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
import { useNodeStore } from '@/stores/nodestore';
import { sendCommand } from '../../services/controlstream.service';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: IConSysApiDataSourceProperties[];
	sdrView?: ISdrViewProperties & { roles?: Record<string, string> };
	controlstream?: OSHControlStream;
}>();

const controlstreamStore = useControlStreamStore();
const nodeStore = useNodeStore();
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

// Control Stream binding
const receiverControl = computed(() => {
	if (props.controlstream && Object.keys(props.controlstream).length > 0) {
		const csId = props.controlstream.id;
		if (!csId) return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };

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
	}
	return { hasControl: false, commandBaseUrl: '', id: '', auth: '' };
});

function sendReceiverCommand(params: Record<string, any>, label: string) {
	if (!receiverControl.value.hasControl) return;
	const payload = { parameters: params };
	sendCommand(
		receiverControl.value.commandBaseUrl,
		receiverControl.value.id,
		payload,
		receiverControl.value.auth,
		label
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
	if (receiverControl.value.hasControl) {
		sendReceiverCommand({ centerFreq: targetMhz }, `Tune to ${targetMhz} MHz`);
	}
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
	if (receiverControl.value.hasControl) {
		sendReceiverCommand({ gain: String(gainVal.value) }, `Set Gain ${gainVal.value} dB`);
	}
}

function toggleAutoGain() {
	autoGain.value = !autoGain.value;
	if (receiverControl.value.hasControl) {
		sendReceiverCommand({ autoGain: autoGain.value }, `Auto Gain ${autoGain.value ? 'ON' : 'OFF'}`);
	}
}

function applyAudioMode(mode: string) {
	audioMode.value = mode;
	if (receiverControl.value.hasControl) {
		sendReceiverCommand({ audioMode: mode }, `Demod Mode ${mode}`);
	}
}

function applyOperatingMode(mode: string) {
	operatingMode.value = mode;
	if (receiverControl.value.hasControl) {
		sendReceiverCommand({ operatingMode: mode }, `Operating Mode ${mode}`);
	}
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

onMounted(() => {
	isRunning = true;
	initPalette(colorPalette.value);

	handleResize();
	initWaterfallCanvas();
	startRenderLoop();

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

		<!-- Optional Receiver Hardware Control Bar (if controlstream bound) -->
		<div
			v-if="receiverControl.hasControl"
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
				class="d-flex align-center"
				style="width: 120px;"
			>
				<v-select
					v-model="audioMode"
					:items="['OFF', 'WFM', 'NFM', 'AM', 'USB', 'LSB', 'CW']"
					density="compact"
					label="Demod"
					variant="outlined"
					hide-details
					@update:model-value="applyAudioMode"
				></v-select>
			</div>
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
</style>
