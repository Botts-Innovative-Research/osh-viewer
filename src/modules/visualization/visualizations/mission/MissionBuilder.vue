<script lang="ts" setup>
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import PlanMission from './PlanMission.vue';
import {
	createDatasource,
	getLatestObservation,
} from '@/modules/visualization/services/datasource.service';
import { sendCommand } from '../../services/controlstream.service';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { VisualizationComponents } from '../../types/visualization';
import { useMapStore } from '@/stores/mapstore';
import {SystemState} from "@/modules/visualization/visualizations/mission/types";

const mapStore = useMapStore();

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

const systemStates = reactive(new Map<string, SystemState>());
const activeSystemId = ref<string | null>(null);
const planMissionRefs = ref<Map<string, InstanceType<typeof PlanMission>>>(new Map());
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
	const cs = viz ? (viz.visualizationComponents as VisualizationComponents).controlstream ?? [] : controlstreams.value;
	return cs.find((c: any) => c.properties && c.properties[role]);
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
function onSetHome(location: { lat: number; lon: number }, viz: OSHVisualization) {
	const cs = getControlstreamByRole('homePos', viz);
	if (!cs) return;
	const protocol = cs.tls ? 'https' : 'http';
	sendCommand(
		`${protocol}://${cs.endpointUrl}`,
		cs.id,
		{ parameters: { locationVectorLL: { Latitude: location.lat, Longitude: location.lon } } },
		`${cs.connectorOpts.username}:${cs.connectorOpts.password}`
	);
}

const activeSystemState = computed(() => {
	if (!activeSystemId.value) return null;
	return systemStates.get(activeSystemId.value) ?? null;
});

function createSystemState(): SystemState {
	return reactive<SystemState>({
		receivedLLA: { lat: 0, lon: 0, alt: 0 },
		receivedStatus: '',
		homeLocation: { lat: 0, lon: 0, alt: 0 },
		llaDatasource: null,
		homeDatasource: null,
		statusDatasource: null,
		dsInstances: [],
	});
}

function onStatusListener(dsInstance: typeof ConSysApi, state: SystemState) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);
	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			state.receivedStatus = data.Status;
		}
	};
}

function onLLAListener(dsInstance: typeof ConSysApi, state: SystemState) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);
	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			state.receivedLLA = {
				lat: data.Location.lat ?? 0,
				lon: data.Location.lon ?? 0,
				alt: data.Location.alt ?? 0,
			};
		}
	};
}

function onHomeLocationListener(dsInstance: typeof ConSysApi, state: SystemState) {
	const dataBroadcastChannel = new BroadcastChannel(DATASOURCE_DATA_TOPIC + dsInstance.id);
	dataBroadcastChannel.onmessage = (message) => {
		if (message.data.type === 'data') {
			const data = message.data.values[0].data;
			state.homeLocation = {
				lat: data.Home.lat ?? 0,
				lon: data.Home.lon ?? 0,
				alt: data.Home.alt ?? 0,
			};
		}
	};
}

function cleanupSystemDatasources(vizId: string) {
	const state = systemStates.get(vizId);
	if (!state) return;

	state.dsInstances.forEach((ds) => ds.disconnect());
	state.llaDatasource = null;
	state.homeDatasource = null;
	state.statusDatasource = null;
	state.dsInstances = [];

	systemStates.delete(vizId);
}

async function connectSystemDatasources(viz: OSHVisualization) {
	const vizId = viz.id;
	cleanupSystemDatasources(vizId);

	const state = createSystemState();
	systemStates.set(vizId, state);

	const dsList = (viz.visualizationComponents as VisualizationComponents).dataSource ?? [];

	for (const ds of dsList) {
		let dsInstance = createDatasource(ds);
		dsInstance.connect();

		if (ds?.properties?.home) {
			state.homeDatasource = dsInstance;
			let homeLLAResults = await getLatestObservation(ds);
			state.homeLocation = {
				lat: homeLLAResults?.result.Home.lat,
				lon: homeLLAResults?.result.Home.lon,
				alt: homeLLAResults?.result.Home.alt,
			};
			onHomeLocationListener(dsInstance, state);
		} else if (ds?.properties?.lla) {
			state.llaDatasource = dsInstance;
			onLLAListener(dsInstance, state);
		} else if (ds?.properties?.status) {
			state.statusDatasource = dsInstance;
			onStatusListener(dsInstance, state);
		}

		state.dsInstances.push(dsInstance);
	}
}


const allDsInstances = computed(() => {
	const all: (typeof ConSysApi)[] = [];
	for (const state of systemStates.values()) {
		all.push(...state.dsInstances);
	}
	return all;
});

useVisualizationCleanup(allDsInstances);

watch(
	() => props.visualizations,
	async (newVizs) => {
		const newIds = new Set(newVizs.map((v) => v.id));

		for (const existingId of [...systemStates.keys()]) {
			if (!newIds.has(existingId)) {
				cleanupSystemDatasources(existingId);
			}
		}

		for (const viz of newVizs) {
			if (!Array.isArray(viz.visualizationComponents)) {
				await connectSystemDatasources(viz);
			}
		}

		if (!activeSystemId.value || !newIds.has(activeSystemId.value)) {
			activeSystemId.value = validVisualizations.value.length > 0
				? validVisualizations.value[0].id
				: null;
		}
	},
	{ immediate: true }
);


function setPlanMissionRef(vizId: string, el: any) {
	if (el) {
		planMissionRefs.value.set(vizId, el);
	} else {
		planMissionRefs.value.delete(vizId);
	}
}

async function sendAllMissions() {
	const systems = validVisualizations.value;
	if (systems.length === 0) return;

	for (const viz of systems) {
		const planRef = planMissionRefs.value.get(viz.id);
		if (planRef) {
      planRef.sendMission();
		}
	}
}

onBeforeUnmount(() => {
	for (const vizId of [...systemStates.keys()]) {
		cleanupSystemDatasources(vizId);
	}
	mapStore.clearMissionWaypoints();
	mapStore.triggerClearWaypointMarkers();
});
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
      class="d-flex align-center ga-2 my-3"
    >
			<v-chip
				v-for="viz in validVisualizations"
				:key="viz.id"
				:color="activeSystemId === viz.id ? 'primary' : undefined"
				:variant="activeSystemId === viz.id ? 'flat' : 'outlined'"
				@click="activeSystemId = viz.id"
			>
				<v-icon
					start
					:icon="detectVehicleType(viz) === 'Ground Rover' ? 'mdi-car' : 'mdi-quadcopter'"
					size="small"
				/>
				{{ viz.name }}
			</v-chip>
		</div>

		<v-card
			v-if="!noController && activeSystemState"
			class="telemetry-card"
		>
			<v-card-text>Live Telemetry</v-card-text>
			<v-row density="comfortable">
				<v-col
					cols="12"
					md="4"
				>
					<v-card-subtitle>Latitude</v-card-subtitle>
					<v-card-title>{{ activeSystemState.receivedLLA.lat.toFixed(6) }}</v-card-title>
				</v-col>
				<v-col
					cols="12"
					md="4"
				>
					<v-card-subtitle>Longitude</v-card-subtitle>
					<v-card-title>{{ activeSystemState.receivedLLA.lon.toFixed(6) }}</v-card-title>
				</v-col>
				<v-col
					cols="12"
					md="4"
				>
					<v-card-subtitle>Altitude</v-card-subtitle>
					<v-card-title>{{ activeSystemState.receivedLLA.alt.toFixed(2) }}</v-card-title>
				</v-col>
			</v-row>
		</v-card>

		<v-card v-if="!noController && activeSystemState" class="status-card">
			<v-card-text class="d-flex align-center">
				<span class="text-subtitle-2 font-weight-medium mr-2">Status:</span>
				<span class="text-title-large">{{ activeSystemState.receivedStatus || 'N/A' }}</span>
			</v-card-text>
		</v-card>

		<v-sheet
			v-if="!noController && activeVisualization"
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
					<div
						v-for="viz in validVisualizations"
						:key="viz.id"
						:style="viz.id !== activeSystemId ? 'display: none' : ''"
					>
						<PlanMission
							:ref="(el: any) => setPlanMissionRef(viz.id, el)"
							:home-location="systemStates.get(viz.id)?.homeLocation ?? { lat: 0, lon: 0, alt: 0 }"
							:mission-control-stream="getControlstreamByRole('roverPlan', viz) ?? getControlstreamByRole('plan', viz)"
							:no-controller="false"
							:system-id="viz.id"
							:vehicle-type="detectVehicleType(viz)"
							@set-home="(loc) => onSetHome(loc, viz)"
						/>
					</div>
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
