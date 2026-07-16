<script lang="ts" setup>
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import PlanMission from './PlanMission.vue';
import {
	createDatasource,
	disconnectDatasources,
	getLatestObservation,
} from '@/modules/visualization/services/datasource.service';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { VisualizationComponents } from '../../types/visualization';
import type { IConSysApiControlStreamProperties } from '../../types/datasource';
import { showToast } from '@/composables/useToast';
import { useMapStore } from '@/stores/mapstore';
import {SystemState} from "@/modules/visualization/visualizations/mission/types";

const mapStore = useMapStore();

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

const systemStates = reactive(new Map<string, SystemState>());
const activeSystemId = ref<string | null>(null);
const activeTab = ref<'plan' | 'control'>('plan');

const noController = computed(() => props.visualizations.length === 0);

const validVisualizations = computed(() =>
	props.visualizations.filter((viz) => !Array.isArray(viz.visualizationComponents))
);

const activeVisualization = computed(() =>
	validVisualizations.value.find((v) => v.id === activeSystemId.value) ?? null
);

const controlstreams = computed(() => {
	if (!activeVisualization.value) return [];
	return (activeVisualization.value.visualizationComponents as VisualizationComponents).controlstream ?? [];
});

function getControlstreamByRole(role: string, viz?: OSHVisualization) {
}

function detectVehicleType(viz: OSHVisualization): string {
	const hasGroundControls =
		!!getControlstreamByRole('driveVelocity', viz) ||
		!!getControlstreamByRole('driveLocation', viz) ||
		!!getControlstreamByRole('driveMode', viz);
	const hasAerialControls =
		!!getControlstreamByRole('takeoff', viz) ||
		!!getControlstreamByRole('land', viz) ||
		!!getControlstreamByRole('offboard', viz);

	if (hasGroundControls && !hasAerialControls) return 'Ground Rover';
	return 'UAV';
}

const activeSystemState = computed(() => {
	if (!activeSystemId.value) return null;
	return systemStates.get(activeSystemId.value) ?? null;
});


function onStatusListener(dsInstance: typeof ConSysApi) {
  const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);

  dataBroadcastChannel.onmessage = (message) => {
    if (message.data.type === 'data') {
      const data = message.data.values[0].data;
      receivedStatus.value = data.Status;
    }
  };
}


function onLLAListener(dsInstance: typeof ConSysApi) {
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

function onHomeLocationListener(dsInstance: typeof ConSysApi) {
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
	if (llaDatasource.value) disconnectDatasources(llaDatasource);
	if (homeDatasource.value) disconnectDatasources(homeDatasource);
	if (statusDatasource.value) disconnectDatasources(statusDatasource);
	llaDatasource.value = null;
  homeDatasource.value = null;
  statusDatasource.value = null;
	dsInstances.value.forEach((ds) => ds.disconnect());
	dsInstances.value = [];
}

async function connectDatasources() {
	for (const ds of datasources.value) {
		let dsInstance = createDatasource(ds);
		dsInstance.connect();

		if (ds?.properties?.home) {
			homeDatasource.value = dsInstance;
			let homeLLAResults = await getLatestObservation(ds);
			homeLocation.value = {
				lat: homeLLAResults?.result.Home.lat,
				lon: homeLLAResults?.result.Home.lon,
				alt: homeLLAResults?.result.Home.alt,
			};
			onHomeLocationListener(dsInstance);
		} else if (ds?.properties?.lla) {
			llaDatasource.value = dsInstance;
			onLLAListener(dsInstance);
		} else if (ds?.properties.status) {
      statusDatasource.value = dsInstance;
      onStatusListener(dsInstance);
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

async function sendAllMissions() {
  console.log('send all missions')
}
onBeforeUnmount(() => {
	cleanupDatasources();
});
useVisualizationCleanup(dsInstances);

const hasCommandPad = computed(
	() =>
		getControlstreamByRole('land') ||
		getControlstreamByRole('pause') ||
		getControlstreamByRole('rtl') ||
		getControlstreamByRole('offboard') ||
		getControlstreamByRole('takeoff') ||
		getControlstreamByRole('driveVelocity') ||
		getControlstreamByRole('driveLocation') ||
		getControlstreamByRole('arm') ||
		getControlstreamByRole('reboot') ||
		getControlstreamByRole('hold') ||
		getControlstreamByRole('homePos') ||
		getControlstreamByRole('driveMode')
);
</script>

<template>
	<v-container
		class="py-4"
		fluid
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

		<div
			v-if="validVisualizations.length > 1"
		>
			<v-chip
				v-for="viz in validVisualizations"
				:key="viz.id"
			>
				<v-icon
					start
					icon="mdi-quadcopter"
					size="small"
				/>
				{{ viz.name }}
			</v-chip>
		</div>

		<v-card
			v-if="!noController"
			class="telemetry-card"
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
					cols="12"
					md="4"
				>
					<v-card-subtitle>Altitude</v-card-subtitle>
					<v-card-title>{{ receivedLLA.alt.toFixed(2) }}</v-card-title>
				</v-col>
			</v-row>
		</v-card>

		<v-card v-if="!noController" class="status-card">
			<v-card-text class="d-flex align-center">
				<span class="text-subtitle-2 font-weight-medium mr-2">Status:</span>
				<span class="text-title-large">{{ receivedStatus || 'N/A' }}</span>
			</v-card-text>
		</v-card>

		<v-sheet
			v-if="!noController"
			class="pa-0 d-flex flex-column"
		>
			<v-tabs
				v-model="activeTab"
				class="mb-2"
				color="primary"
				grow
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
					<PlanMission
						:home-location="homeLocation"
						:mission-control-stream="missionControlStream"
						:no-controller="noController"
					/>
				</v-window-item>

				<v-window-item value="control">
					<v-card v-if="hasCommandPad">
						<MissionCommandPad :controlstreams="controlstreams" />
					</v-card>
				</v-window-item>
			</v-window>
		</v-sheet>

		<v-btn
			v-if="validVisualizations.length > 1"
			block
			class="mt-4"
			color="primary"
			variant="tonal"
			@click="sendAllMissions"
		>
			Send All Missions
		</v-btn>
	</v-container>
</template>

<style scoped></style>
