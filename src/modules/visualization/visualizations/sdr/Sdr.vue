<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
// @ts-ignore
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
// @ts-ignore
import SdrLayer from 'osh-js/source/core/ui/layer/SdrLayer.js';
// @ts-ignore
import SdrView from 'osh-js/source/core/ui/view/sdr/SdrView.js';
import { OSHControlStream, OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { createDatasource } from '@/modules/visualization/services/datasource.service';
import { sendCommand } from '../../services/controlstream.service';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { IConSysApiDataSourceProperties } from '../../types/datasource';
import { ISdrLayerProperties } from '../../types/layers';
import { ISdrViewProperties } from '../../types/views';

const props = defineProps<{
	visualization: OSHVisualization;
	datasource: IConSysApiDataSourceProperties[];
	sdrLayer?: ISdrLayerProperties;
	sdrView?: ISdrViewProperties;
	controlstream?: OSHControlStream;
}>();

const controlstreamStore = useControlStreamStore();
const sdrContainerId = ref(`sdr-${props.visualization.id}`);

// The spectrum roles of the SdrLayer the wizard can map to a record field
const SDR_ROLES = [
	'amplitude',
	'centerFrequency',
	'frequencyAxis',
	'sampleRate',
	'startFrequency',
	'stopFrequency',
	'audio',
];

// The outputs each HTL connection publishes, used to tell which one the radio is reached by
const HTL_1GBE_OUTPUTS = ['spectrum', 'scout', 'audio'];
const HTL_10GBE_OUTPUTS = ['tunerstatus', 'collectorstatus', 'iq'];

const dsInstances = ref<(typeof ConSysApi)[]>([]);
let sdrLayerInstance: typeof SdrLayer | null = null;
let sdrViewInstance: typeof SdrView | null = null;

function getDatasourceList(): IConSysApiDataSourceProperties[] {
	if (Array.isArray(props.datasource)) {
		return (props.datasource as any[]).flat().filter(Boolean);
	}
	return props.datasource ? [props.datasource] : [];
}

/**
 * Maps every configured spectrum role to the name of the record field carrying it. The roles
 * built by the wizard come first, the ones carried by the datasources themselves refining them
 * so that each selected stream resolves against the property it was configured with.
 */
function buildRoles(): { [role: string]: string } {
	const roles: { [role: string]: string } = { ...(props.sdrLayer?.roles ?? {}) };

	for (const dsProps of getDatasourceList()) {
		for (const role of SDR_ROLES) {
			const property = (dsProps.properties as any)?.[role]?.property;
			if (property) {
				roles[role] = property;
			}
		}
	}

	return roles;
}

/**
 * Returns the names and the output names of every stream the visualization is built on, which is
 * what the receiver type and the HTL connection are recognized from.
 */
function getStreamNames(): string[] {
	const names: (string | undefined)[] = [];

	for (const ds of props.visualization.datastream ?? []) {
		names.push(ds.name, ds.datastream?.properties?.name, ds.datastream?.properties?.outputName);
	}

	const cs = resolveControlStream();
	names.push(props.controlstream?.name, cs?.name, cs?.controlstream?.properties?.name);

	return names.filter((name): name is string => Boolean(name)).map((name) => name.toLowerCase());
}

/**
 * @return the command set the receiver takes: 'htl' for the HTL radio command choices, 'rtlsdr'
 * for the flat receiver parameters
 */
function detectReceiverType(): string {
	if (props.sdrView?.receiverType) {
		return props.sdrView.receiverType;
	}
	return getStreamNames().some((name) => name.includes('htl')) ? 'htl' : 'rtlsdr';
}

/**
 * @return the HTL connection the radio is reached by, which gates the controls it offers.
 * 'UNKNOWN' leaves it to the view, which recognizes a 1 GbE connection by the swept band it
 * publishes
 */
function detectConnectionMode(): string {
	if (props.sdrView?.connectionMode) {
		return props.sdrView.connectionMode;
	}

	const names = getStreamNames();
	const is1Gbe = names.some((name) => HTL_1GBE_OUTPUTS.some((output) => name.includes(output)));
	const is10Gbe = names.some((name) => HTL_10GBE_OUTPUTS.some((output) => name.includes(output)));

	if (is1Gbe && is10Gbe) return 'BOTH';
	if (is10Gbe) return '10GbE';
	if (is1Gbe) return '1GbE';
	return 'UNKNOWN';
}

function resolveControlStream(): any {
	const csId = props.controlstream?.id;
	if (!csId) return null;

	const controlStreams = controlstreamStore.getControlStreamsById([csId]);
	return controlStreams && controlStreams.length > 0 ? controlStreams[0] : null;
}

/**
 * Builds the sink the view posts its receiver commands to, or undefined when the visualization
 * was configured without a control stream, which leaves the view read only.
 */
function buildCommandSink(): ((payload: any, label: string) => void) | undefined {
	const csId = props.controlstream?.id;
	if (!csId) return undefined;

	const networkProps = resolveControlStream()?.controlstream?.networkProperties;
	const protocol = networkProps?.tls ? 'https' : 'http';
	const endpoint = (networkProps?.endpointUrl ?? '')
		.replace(/^https?:\/\//, '')
		.replace(/\/+$/, '');
	const commandBaseUrl = endpoint ? `${protocol}://${endpoint}` : '';
	const auth = `${networkProps?.connectorOpts?.username ?? ''}:${networkProps?.connectorOpts?.password ?? ''}`;

	return (payload: any, label: string) =>
		sendCommand(commandBaseUrl, csId, payload, auth, label);
}

function initializeSdr() {
	const viz = props.visualization;
	if (!viz || viz.type !== 'sdr') return;

	const dsList = getDatasourceList();

	for (const dsProps of dsList) {
		const dsInstance = createDatasource(dsProps);
		dsInstance.connect();
		dsInstances.value.push(dsInstance);
	}

	const roles = buildRoles();

	sdrLayerInstance = new SdrLayer({
		...(props.sdrLayer ?? {}),
		name: props.sdrLayer?.name ?? viz.name,
		dataSourceIds: dsInstances.value.map((ds: any) => ds.id),
		roles: roles,
	});
	console.log('[Sdr.vue] Creating SdrLayer:', sdrLayerInstance);

	// the demodulated audio is carried by the observations of the datastream mapped to the audio
	// role, so the listening controls are only offered when one was mapped
	const commandSink = buildCommandSink();
	const showAudioControls = props.sdrView?.showAudioControls ?? roles.audio !== undefined;

	sdrViewInstance = new SdrView({
		...(props.sdrView ?? {}),
		container: sdrContainerId.value,
		layers: [sdrLayerInstance],
		receiverType: detectReceiverType(),
		connectionMode: detectConnectionMode(),
		showAudioControls: showAudioControls,
		showReceiverControls:
			props.sdrView?.showReceiverControls ?? (commandSink !== undefined || showAudioControls),
		...(commandSink ? { sendCommand: commandSink } : {}),
	});
	console.log('[Sdr.vue] SDR view created:', sdrViewInstance);
}

onMounted(() => {
	initializeSdr();
});

onBeforeUnmount(() => {
	sdrViewInstance?.destroy?.();
	sdrViewInstance = null;
	sdrLayerInstance = null;
});

useVisualizationCleanup(dsInstances);
</script>

<template>
	<div
		:id="sdrContainerId"
		class="sdr-visualization"
	></div>
</template>

<style scoped>
.sdr-visualization {
	width: 100%;
}
</style>
