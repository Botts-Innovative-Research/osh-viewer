<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useMapStore } from '@/stores/mapstore';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import {
	createDatasource,
	disconnectDatasources,
	getLatestObservation,
} from '@/modules/visualization/services/datasource.service';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { VisualizationComponents } from '../../types/visualization';

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

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

const activeVisualization = computed(() => {
	if (!props.visualizations.length) return null;
	const viz = props.visualizations[0];
	if (Array.isArray(viz.visualizationComponents)) return null;
	return viz;
});

const datasources = computed(() => {
	if (!activeVisualization.value) return [];
	return (
		(activeVisualization.value.visualizationComponents as VisualizationComponents).dataSource ??
		[]
	);
});

const controlstreams = computed(() => {
	if (!activeVisualization.value) return [];
	return (
		(activeVisualization.value.visualizationComponents as VisualizationComponents)
			.controlstream ?? []
	);
});

function getControlstreamByRole(role: string) {
	return controlstreams.value.find((cs: any) => cs.properties && cs.properties[role]);
}

const isRover = computed(() => !!getControlstreamByRole('roverPlan'));

const missionControlStream = computed<Controlstream | undefined>(() =>
	getControlstreamByRole('roverPlan') ?? getControlstreamByRole('plan')
);

const noController = computed(() => props.visualizations.length === 0);

const activeTab = ref<'plan' | 'control'>('plan');

interface LLAData {
	lat: number;
	lon: number;
	alt: number;
}

const receivedLLA = ref<LLAData>({ lat: 0, lon: 0, alt: 0 });
const mapStore = useMapStore();

const droneDatasourceLLA = ref<(typeof ConSysApi) | null>(null);
const droneHomeDatasource = ref<(typeof ConSysApi) | null>(null);
let dsInstances = ref<(typeof ConSysApi[])>([]);

let homeLocation = ref<{ lat: number; lon: number; alt: number }>({ lat: 0, lon: 0, alt: 0 });

function onLLAListener(dsInstance: ConSysApi) {
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

function onHomeLocationListener(dsInstance: ConSysApi) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			homeLocation.value = {
				lat: data.Home.lat ?? 0,
				lon: data.Home.lon ?? 0,
				alt: data.Home.alt ?? 0,
			};
		}
	};
}

function cleanupDatasources() {
	if (droneDatasourceLLA.value) disconnectDatasources(droneDatasourceLLA);
	if (droneHomeDatasource.value) disconnectDatasources(droneHomeDatasource);
	droneDatasourceLLA.value = null;
	droneHomeDatasource.value = null;
	dsInstances.value.forEach((ds) => ds.disconnect());
	dsInstances.value = [];
}

async function connectDatasources() {
	for (const ds of datasources.value) {
		let dsInstance = createDatasource(ds);
		dsInstance.connect();

		if (ds?.properties?.home) {
			droneHomeDatasource.value = dsInstance;
			let homeLLAResults = await getLatestObservation(ds);
			homeLocation.value = {
				lat: homeLLAResults.result.Home.lat,
				lon: homeLLAResults.result.Home.lon,
				alt: homeLLAResults.result.Home.alt,
			};
			onHomeLocationListener(dsInstance);
		} else if (ds?.properties?.lla) {
			droneDatasourceLLA.value = dsInstance;
			onLLAListener(dsInstance);
		}

		dsInstances.value.push(dsInstance);
	}
}

watch(
	activeVisualization,
	async () => {
		cleanupDatasources();
		if (!activeVisualization.value) return;
		await connectDatasources();
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	cleanupDatasources();
});
useVisualizationCleanup(dsInstances);

const hasCommandPad = computed(() =>
	getControlstreamByRole('land') ||
	getControlstreamByRole('pause') ||
	getControlstreamByRole('rtl') ||
	getControlstreamByRole('offboard') ||
	getControlstreamByRole('takeoff') ||
	getControlstreamByRole('driveVelocity') ||
	getControlstreamByRole('driveLocation') ||
	getControlstreamByRole('arm') ||
	getControlstreamByRole('reboot') ||
	getControlstreamByRole('driveMode')
);
</script>

<template>
	<v-container
		fluid
		class="py-4"
	>
		<v-row
			class="d-flex align-center"
			no-gutters
		>
			<v-col>
				<slot name="controllers"></slot>
				<p class="text-caption text-grey mt-1">
					Select a controller to build and send missions.
				</p>
			</v-col>
		</v-row>
		<v-divider v-if="!noController"></v-divider>

		<v-card
			class="telemetry-card"
			v-if="!noController"
		>
			<v-card-text>Live Telemetry</v-card-text>
			<v-row density="comfortable">
				<v-col
					cols="12"
					md="4"
				>
					<v-card-subtitle>Latitude</v-card-subtitle>
					<v-card-title>{{ receivedLLA.lat.toFixed(6) }}</v-card-title>
				</v-col>
				<v-col
					cols="12"
					md="4"
				>
					<v-card-subtitle>Longitude</v-card-subtitle>
					<v-card-title>{{ receivedLLA.lon.toFixed(6) }}</v-card-title>
				</v-col>
				<v-col
					v-if="!isRover"
					cols="12"
					md="4"
				>
					<v-card-subtitle>Altitude</v-card-subtitle>
					<v-card-title>{{ receivedLLA.alt.toFixed(2) }}</v-card-title>
				</v-col>
			</v-row>
		</v-card>

		<v-sheet
			class="pa-0 d-flex flex-column"
			v-if="!noController"
		>
			<v-tabs
				v-model="activeTab"
				grow
				color="primary"
				class="mb-2"
			>
				<v-tab value="plan">
					<span>Plan</span>
				</v-tab>
				<v-tab value="control">
					<span>Control</span>
				</v-tab>
			</v-tabs>

			<v-window v-model="activeTab">
				<v-window-item value="plan">
				</v-window-item>

				<v-window-item value="control">
					<v-card v-if="hasCommandPad">
						<MissionCommandPad :controlstreams="controlstreams" />
					</v-card>
				</v-window-item>
			</v-window>
		</v-sheet>
	</v-container>
</template>

<style scoped>
</style>
