<script lang="ts" setup>
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import LongPressButton from '@/components/ui/LongPressButton.vue';
import PanelVisualizationWrapper from '../../sidebar/components/PanelVisualizationWrapper.vue';
import PlanMission from './PlanMission.vue';
import MissionSummaryDialog from './MissionSummaryDialog.vue';
import type { MissionSummary } from './MissionSummaryDialog.vue';
import {
	createDatasource,
	getLatestObservation,
} from '@/modules/visualization/services/datasource.service';
import { sendCommand } from '../../services/controlstream.service';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import { VisualizationComponents } from '../../types/visualization';
import { useMapStore } from '@/stores/mapstore';
import { useMissionStore } from '@/stores/missionstore';
import { SystemState } from '@/modules/visualization/visualizations/mission/types';
import ToggleActionButton from '@/components/ui/ToggleActionButton.vue';

const missionStore = useMissionStore();

const props = defineProps<{
	visualizations: OSHVisualization[];
}>();

const systemStates = reactive(new Map<string, SystemState>());
const activeSystemId = ref<string | null>(null);
const planMissionRefs = ref<Map<string, InstanceType<typeof PlanMission>>>(new Map());
const activeTab = ref<'plan' | 'control'>('plan');
const minimapViewActive = ref(false);

const noController = computed(() => props.visualizations.length === 0);

const validVisualizations = computed(() =>
	props.visualizations.filter((viz) => !Array.isArray(viz.visualizationComponents))
);

const activeVisualization = computed(
	() => validVisualizations.value.find((v) => v.id === activeSystemId.value) ?? null
);

const controlstreams = computed(() => {
	if (!activeVisualization.value) return [];
	return (
		(activeVisualization.value.visualizationComponents as VisualizationComponents)
			.controlstream ?? []
	);
});

function getControlstreamByRole(role: string, viz?: OSHVisualization) {
	const cs = viz
		? ((viz.visualizationComponents as VisualizationComponents).controlstream ?? [])
		: controlstreams.value;
	return cs.find((c: any) => c.properties && c.properties[role]);
}

const minimapViz = computed(
	() =>
		activeVisualization.value?.children?.find((c: OSHVisualization) => c.type === 'minimap') ??
		null
);

function getVehicleTypeForViz(vizId: string): string {
	const planRef = planMissionRefs.value.get(vizId);
	return planRef?.vehicleType ?? '';
}
function onSetHome(location: { lat: number; lon: number }, viz: OSHVisualization) {
	const cs = getControlstreamByRole('homePos', viz);
	if (!cs) return;
	const protocol = cs.tls ? 'https' : 'http';
	sendCommand(
		`${protocol}://${cs.endpointUrl}`,
		cs.id,
		{ parameters: { locationVectorLL: { lat: location.lat, lon: location.lon } } },
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

		if (ds?.properties?.homeLocation) {
			state.homeDatasource = dsInstance;
			let homeLLAResults = await getLatestObservation(ds);
			state.homeLocation = {
				lat: homeLLAResults?.result.Home.lat,
				lon: homeLLAResults?.result.Home.lon,
				alt: homeLLAResults?.result.Home.alt,
			};
			onHomeLocationListener(dsInstance, state);
		} else if (ds?.properties?.location) {
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
			activeSystemId.value =
				validVisualizations.value.length > 0 ? validVisualizations.value[0].id : null;
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

const showSendAllSummary = ref(false);

const allMissionSummaries = computed<MissionSummary[]>(() => {
	const summaries: MissionSummary[] = [];
	for (const viz of validVisualizations.value) {
		const planRef = planMissionRefs.value.get(viz.id);
		if (planRef && planRef.waypoints.length > 0) {
			summaries.push({
				name: viz.name,
				missionSource: 'waypoints',
				vehicleType: getVehicleTypeForViz(viz.id),
				waypointCount: planRef.waypoints.length,
				cruiseSpeed: planRef.cruiseSpeed,
				waypointAltitude: planRef.waypointAltitude,
				totalDistance: planRef.totalDistance,
				estimatedTime: planRef.estimatedTime,
			});
		}
	}
	return summaries;
});

const numPlannedMissions = computed(() => allMissionSummaries.value.length);
const hasAnyMissions = computed(() => numPlannedMissions.value > 0);

const delayBetweenMissions = ref<number>(0);
const isSendingAll = ref(false);
const sendAllCountdown = ref(0);
const sendAllCurrentIndex = ref(0);
const sendAllTotal = ref(0);
let sendAllTimer: ReturnType<typeof setInterval> | null = null;

function cancelSendAll() {
	if (sendAllTimer) {
		clearInterval(sendAllTimer);
		sendAllTimer = null;
	}
	isSendingAll.value = false;
	sendAllCountdown.value = 0;
	sendAllCurrentIndex.value = 0;
	sendAllTotal.value = 0;
}

function confirmSendAllMissions() {
	showSendAllSummary.value = true;
}

function sendAllMissions() {
	showSendAllSummary.value = false;

	const missionsToSend = validVisualizations.value.filter((viz) => {
		const planRef = planMissionRefs.value.get(viz.id);
		return planRef && planRef.waypoints.length > 0;
	});

	if (missionsToSend.length === 0) return;

	const delay = delayBetweenMissions.value;

	if (delay <= 0) {
		for (const viz of missionsToSend) {
			planMissionRefs.value.get(viz.id)!.executeMission();
		}
		return;
	}

	isSendingAll.value = true;
	sendAllTotal.value = missionsToSend.length;
	sendAllCurrentIndex.value = 0;

	function sendNext() {
		if (sendAllCurrentIndex.value >= missionsToSend.length) {
			cancelSendAll();
			return;
		}

		const viz = missionsToSend[sendAllCurrentIndex.value];
		planMissionRefs.value.get(viz.id)!.executeMission();
		sendAllCurrentIndex.value++;

		if (sendAllCurrentIndex.value < missionsToSend.length) {
			sendAllCountdown.value = delay;
			sendAllTimer = setInterval(() => {
				sendAllCountdown.value--;
				if (sendAllCountdown.value <= 0) {
					if (sendAllTimer) {
						clearInterval(sendAllTimer);
						sendAllTimer = null;
					}
					sendNext();
				}
			}, 1000);
		} else {
			cancelSendAll();
		}
	}

	sendNext();
}

onBeforeUnmount(() => {
	cancelSendAll();
	for (const vizId of [...systemStates.keys()]) {
		cleanupSystemDatasources(vizId);
	}
	missionStore.clearMissionWaypoints();
});

const hasAnyRtl = computed(() =>
	validVisualizations.value.some((viz) => getControlstreamByRole('rtl', viz))
);

function returnAllHome() {
	for (const viz of validVisualizations.value) {
		const cs = getControlstreamByRole('rtl', viz);
		if (!cs) continue;
		const protocol = cs.tls ? 'https' : 'http';
		sendCommand(
			`${protocol}://${cs.endpointUrl}`,
			cs.id,
			{ parameters: { rtl: true } },
			`${cs.connectorOpts.username}:${cs.connectorOpts.password}`,
			'All systems RTL'
		);
	}
}

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
			:class="`d-flex align-center ${noController ? '' : 'pb-4'}`"
			no-gutters
		>
			<v-col>
				<slot name="controllers"></slot>
			</v-col>
		</v-row>
		<v-divider
			v-if="!noController"
			class="mb-2"
		></v-divider>

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
					:icon="
						getVehicleTypeForViz(viz.id) === 'Ground Rover' ||
						getVehicleTypeForViz(viz.id) === 'Surface Boat'
							? 'mdi-car'
							: getVehicleTypeForViz(viz.id) === 'Submarine'
								? 'mdi-submarine'
								: getVehicleTypeForViz(viz.id) === 'UAV'
									? 'mdi-quadcopter'
									: 'mdi-robot'
					"
					size="small"
				/>
				{{ viz.name }}
			</v-chip>
		</div>

		<LongPressButton
			v-if="hasAnyRtl"
			class="mb-2"
			icon="mdi-home"
			label="Return All Home"
			color="warning"
			tooltip="Send RTL command to all systems."
			:duration="1200"
			@confirm="returnAllHome"
		/>
		<ToggleActionButton
			v-if="!noController"
			:toggle-on="minimapViewActive"
			tool-name="Mini Map"
			@submit="minimapViewActive = !minimapViewActive"
		></ToggleActionButton>
		<v-sheet v-if="!noController && activeSystemState">
			<v-expand-transition>
				<v-card
					v-if="minimapViewActive && minimapViz"
					class="minimap-card"
				>
					<div class="d-flex align-center justify-space-between px-2 pt-1">
						<span class="text-caption font-weight-medium">Mini Map</span>
					</div>
					<PanelVisualizationWrapper
						:key="activeSystemId"
						:viz="minimapViz"
					/>
				</v-card>
			</v-expand-transition>
			<v-card class="telemetry-card">
				<div class="d-flex align-center justify-space-between px-4 pt-2">
					<v-card-text class="pa-0">Live Telemetry</v-card-text>
				</div>
				<v-row density="comfortable">
					<v-col
						cols="12"
						md="4"
					>
						<v-card-subtitle>Latitude</v-card-subtitle>
						<v-card-title>{{
							activeSystemState.receivedLLA.lat.toFixed(6)
						}}</v-card-title>
					</v-col>
					<v-col
						cols="12"
						md="4"
					>
						<v-card-subtitle>Longitude</v-card-subtitle>
						<v-card-title>{{
							activeSystemState.receivedLLA.lon.toFixed(6)
						}}</v-card-title>
					</v-col>
					<v-col
						cols="12"
						md="4"
					>
						<v-card-subtitle>Altitude</v-card-subtitle>
						<v-card-title>{{
							activeSystemState.receivedLLA.alt.toFixed(2)
						}}</v-card-title>
					</v-col>
				</v-row>
			</v-card>

			<v-card class="status-card">
				<v-card-text class="d-flex align-center">
					<span class="text-subtitle-2 font-weight-medium mr-2">Status:</span>
					<span class="text-title-large">{{
						activeSystemState.receivedStatus || 'N/A'
					}}</span>
				</v-card-text>
			</v-card>
		</v-sheet>

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
							:home-location="
								systemStates.get(viz.id)?.homeLocation ?? { lat: 0, lon: 0, alt: 0 }
							"
							:is-active="viz.id === activeSystemId"
							:mission-control-stream="
								getControlstreamByRole('roverPlan', viz) ??
								getControlstreamByRole('plan', viz)
							"
							:no-controller="false"
							:system-id="viz.id"
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

		<div v-if="validVisualizations.length > 1" class="mt-4">
			<v-text-field
				v-model.number="delayBetweenMissions"
				class="mb-2"
				density="compact"
				hide-details
				label="Delay Between Missions (seconds)"
				min="0"
				type="number"
			/>

      <v-alert
          v-if="isSendingAll"
          class="mb-2"
          color="warning"
          density="compact"
          variant="tonal"
			>
        <div class="d-flex align-center justify-space-between">
          <span>Sent {{ sendAllCurrentIndex }}/{{ sendAllTotal }} — next in {{ sendAllCountdown }}s</span>
          <v-btn
						color="error"
						density="compact"
						size="small"
						variant="text"
						@click="cancelSendAll"
					>
						Cancel
					</v-btn>
				</div>
			</v-alert>

			<v-btn
				block
        class="mt-4"
        color="primary"
				variant="tonal"
				:disabled="!hasAnyMissions || isSendingAll"
				@click="confirmSendAllMissions"
			>
				Send All Missions ( {{ numPlannedMissions }} )
			</v-btn>
		</div>

		<MissionSummaryDialog
			v-model="showSendAllSummary"
			:missions="allMissionSummaries"
			@send="sendAllMissions"
		/>
	</v-container>
</template>

<style scoped>
.minimap-card {
	height: 425px;
	overflow: hidden;
}
</style>
