<script setup lang="ts">
import { OSHVisualization } from '@/lib/OSHConnectDataStructs';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useMapStore } from '@/stores/mapstore';
import { showToast } from '@/composables/useToast';
import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource.js';
import MissionCommandPad from './MissionCommandPad.vue';
import PanelVisualizationWrapper from '../../sidebar/components/PanelVisualizationWrapper.vue';
import {
	createDatasource,
	disconnectDatasources,
	getLatestObservation,
} from '@/modules/visualization/services/datasource.service';
import { DATASOURCE_DATA_TOPIC } from 'osh-js/source/core/Constants.js';
import { useVisualizationCleanup } from '../../sidebar/composables/useVisualizationCleanup';
import {
	sendCommand,
	fetchCsSchema,
	mineControlObsPropsFromCS,
} from '../../services/controlstream.service';
import { VisualizationComponents } from '../../types/visualization';
import { VueDraggable } from 'vue-draggable-plus';

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

// Helper to find controlstream by role
function getControlstreamByRole(role: string) {
	return controlstreams.value.find((cs: any) => cs.properties && cs.properties[role]);
}

// Get the plan controlstream for sending missions
const missionControlStream = computed<Controlstream | undefined>(() =>
	getControlstreamByRole('plan')
);

const noController = computed(() => props.visualizations.length === 0);


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

const minimapViz = computed(() =>
	activeVisualization.value?.children?.find((c: OSHVisualization) => c.type === 'minimap') ?? null
);

const missionSource = ref<'waypoints' | 'file'>('waypoints');

const receivedLLA = ref<LLAData>({ lat: 0, lon: 0, alt: 0 });
const waypoints = ref<Waypoint[]>([]);

const latInput = ref<number>(0.0);
const lonInput = ref<number>(0.0);
const altInput = ref<number>(25.0);
const waypointForm = ref<any>(null);

const mapStore = useMapStore();
const isSelected = ref<boolean>(false);
const fileInputRef = ref<any | null>(null);
const selectedFile = ref<File | null>(null);
const exportFilename = ref<string>('mission');

const droneDatasourceLLA = ref<typeof ConSysApi | null>(null);
const droneHomeDatasource = ref<typeof ConSysApi | null>(null);
let dsInstances = ref<typeof ConSysApi[]>([]);

let homeLocation = ref<{ lat: number; lon: number; alt: number }>({ lat: 0, lon: 0, alt: 0 });

const cruiseSpeed = ref<number>(15);
const hoverSpeed = ref<number>(5);
const waypointAltitude = ref<number>(25.0);
const altitudeMode = ref<number>(1);
const autoContinue = ref<boolean>(true);
const amslAltAboveTerrain = ref<number | null>(null);

const altitudeModeOptions = [{ title: 'AMSL (Above Mean Sea Level)', value: 1 }];

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

watch(
	() => mapStore.selectedWaypoints,
	(newVal) => {
		const cs = missionControlStream.value;
		if (cs && newVal?.controlStreamId === cs.id) {
			isSelected.value = true;
		} else {
			isSelected.value = false;
		}
	}
);

watch(waypointAltitude, (newAlt) => {
	altInput.value = newAlt;
});

watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isSelected.value && newVal) {
			latInput.value = newVal.latitude;
			lonInput.value = newVal.longitude;
			altInput.value = waypointAltitude.value;
			addWaypoint();
		}
	}
);

function toggle() {
	const cs = missionControlStream.value;
	if (isSelected.value) {
		mapStore.disableWaypointSelection();
	} else if (cs) {
		mapStore.setSelectedWaypoints(
			cs.id,
			commandBaseUrl.value,
			`${csAuth.value.username}:${csAuth.value.password}`
		);
	}
}

async function addWaypoint() {
	const { valid } = await waypointForm.value.validate();
	if (!valid) return;

	missionSource.value = 'waypoints';
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
	waypoints.value = waypoints.value.filter((wp) => wp.id !== id);
	console.log('[MissionBuilder.vue] Removed waypoint:', id);
}

const showClearConfirm = ref(false);

const showMissionSummary = ref(false);
const minimapViewActive = ref(false);

function confirmSendMission() {
	showMissionSummary.value = true;
}

const showExportDialog = ref(false);

function exportMissionPlan() {
	const plan = generateMissionControlPlan();
	if (!plan) {
		showToast('No waypoints to export', 'ERROR');
		return;
	}
	const name = exportFilename.value.trim() || 'mission';
	const filename = name.endsWith('.plan') ? name : name + '.plan';
	const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
	showExportDialog.value = false;
}

function clearWaypoints() {
	waypoints.value = [];
	mapStore.clearMissionWaypoints();
	mapStore.triggerClearWaypointMarkers();
	showClearConfirm.value = false;
	console.log('[MissionBuilder.vue] Cleared all waypoints');
}

watch(
	waypoints,
	(newWaypoints) => {
		mapStore.setFlightPathWaypoints(
			newWaypoints.map((wp) => ({
				lat: wp.lat,
				lon: wp.lon,
				alt: wp.alt,
			}))
		);
	},
	{ deep: true }
);

function buildCommandParameters(plan: any) {
	const mission = plan.mission;
	const geoFence = plan.geoFence ?? { circles: [], polygons: [], version: 2 };
	const rallyPoints = plan.rallyPoints ?? { points: [], version: 2 };

	return {
		fileType: plan.fileType,
		groundStation: plan.groundStation,
		mission: {
			cruiseSpeed: mission.cruiseSpeed,
			firmwareType: mission.firmwareType,
			globalPlanAltitudeMode: mission.globalPlanAltitudeMode,
			hoverSpeed: mission.hoverSpeed,
			itemsCount: mission.items.length,
			items: mission.items.map((item: any) => ({
				AMSLAltAboveTerrain: item.AMSLAltAboveTerrain ?? 0,
				Altitude: item.Altitude,
				AltitudeMode: item.AltitudeMode,
				autoContinue: item.autoContinue,
				command: item.command,
				doJumpId: item.doJumpId,
				frame: item.frame,
				params: item.params.map((p: any) => p ?? 0),
				type: item.type,
			})),
			plannedHomePosition: mission.plannedHomePosition,
			vehicleType: mission.vehicleType,
			version: mission.version,
		},
		geoFence: {
			circlesCount: geoFence.circles.length,
			circles: geoFence.circles.map((c: any) => ({
				inclusion: c.inclusion ?? true,
				latitude: c.latitude ?? c.center?.[0] ?? 0,
				longitude: c.longitude ?? c.center?.[1] ?? 0,
				radius: c.radius ?? 0,
			})),
			polygonsCount: geoFence.polygons.length,
			polygons: geoFence.polygons.map((p: any) => ({
				inclusion: p.inclusion ?? true,
				vertexCount: (p.vertices ?? p.polygon ?? []).length,
				vertices: (p.vertices ?? p.polygon ?? []).map((v: any) => ({
					latitude: v.latitude ?? v[0] ?? 0,
					longitude: v.longitude ?? v[1] ?? 0,
				})),
			})),
			version: geoFence.version ?? 2,
		},
		rallyPoints: {
			pointsCount: rallyPoints.points.length,
			points: rallyPoints.points.map((p: any) => ({
				latitude: p.latitude ?? p[0] ?? 0,
				longitude: p.longitude ?? p[1] ?? 0,
				altitude: p.altitude ?? p[2] ?? 0,
			})),
			version: rallyPoints.version ?? 2,
		},
		version: plan.version,
	};
}

async function isLegacyPlanSchema(): Promise<boolean> {
	const cs = missionControlStream.value;
	if (!cs) return false;

	try {
		const { cs: storeCs } = mineControlObsPropsFromCS(cs.id);
		const schema = await fetchCsSchema(storeCs.controlstream);
		if (!schema?.parametersSchema) return false;

		const items = schema.parametersSchema.fields ?? schema.parametersSchema;
		if (Array.isArray(items)) {
			return items.length === 1 && items[0].name === 'qGroundControlPlan';
		}
		return items.name === 'qGroundControlPlan';
	} catch (e) {
		console.warn('[MissionBuilder.vue] Could not fetch schema, using structured format:', e);
		return false;
	}
}

function sendMission() {
	showMissionSummary.value = false;
	if (missionSource.value === 'waypoints') sendWaypoints();
	if (missionSource.value === 'file') sendQGCPlanFileUpload();
}

async function sendWaypoints() {
	const plan = generateMissionControlPlan();

	if (!plan) {
		showToast('Cannot send empty mission', 'ERROR');
		return;
	}

	const cs = missionControlStream.value;
	if (!cs) {
		showToast('No mission controlstream configured', 'ERROR');
		return;
	}

	const parameters = buildCommandParameters(plan);
	const legacy = await isLegacyPlanSchema();
	const command = {
		parameters: legacy ? { qGroundControlPlan: JSON.stringify(parameters) } : parameters,
	};

	console.log(
		'[MissionBuilder.vue] Sending MissionBuilder command:',
		command,
		legacy ? '(legacy)' : '(structured)'
	);
	sendCommand(
		commandBaseUrl.value,
		cs.id,
		command,
		`${csAuth.value.username}:${csAuth.value.password}`
	);
}

async function sendQGCPlanFileUpload() {
	if (!selectedFile.value) {
		console.warn('[MissionBuilder.vue] No file selected');
		return;
	}

	const cs = missionControlStream.value;
	if (!cs) {
		showToast('No plan controlstream configured', 'ERROR');
		return;
	}

	const fileContent = await selectedFile.value.text();

	let plan: any;
	try {
		plan = JSON.parse(fileContent);
	} catch (err) {
		showToast('Invalid plan file format', 'ERROR');
		console.error('[MissionBuilder.vue] Failed to parse plan file:', err);
		return;
	}

	const parameters = buildCommandParameters(plan);
	const legacy = await isLegacyPlanSchema();
	const command = {
		parameters: legacy ? { plan: JSON.stringify(parameters) } : parameters,
	};

	console.log(
		'[MissionBuilder.vue] Sending mission file command:',
		command,
		legacy ? '(legacy)' : '(structured)',
		missionControlStream.value
	);
	sendCommand(
		commandBaseUrl.value,
		cs.id,
		command,
		`${csAuth.value.username}:${csAuth.value.password}`
	);
}

function handleFileChange(event: Event) {
	const input = event.target as HTMLInputElement;

	if (!input.files || input.files.length === 0) {
		return;
	}

	selectedFile.value = input.files[0];
	missionSource.value = 'file';
	input.value = '';
}

const triggerFileInput = () => {
	fileInputRef.value?.click();
};

function clearSelectedFile() {
	selectedFile.value = null;
	if (fileInputRef.value) {
		fileInputRef.value.value = '';
	}
}

function generateMissionControlPlan() {
	if (waypoints.value.length === 0) {
		console.warn('[MissionBuilder.vue] No waypoints to generate plan');
		return null;
	}

	const plannedHomePosition = [
		homeLocation.value?.lat ?? waypoints.value[0].lat,
		homeLocation.value?.lon ?? waypoints.value[0].lon,
		homeLocation.value?.alt ?? waypoints.value[0].alt,
	];

	// send takeoff
	const takeoffLocation = homeLocation.value ?? waypoints.value[0];

	const items: any[] = [
		{
			AMSLAltAboveTerrain: amslAltAboveTerrain.value,
			Altitude: waypointAltitude.value,
			AltitudeMode: altitudeMode.value,
			autoContinue: autoContinue.value,
			command: 22, // 22 = takeoff
			doJumpId: 1,
			frame: 3,
			params: [0, 0, 0, null, takeoffLocation.lat, takeoffLocation.lon, takeoffLocation.alt],
			type: 'SimpleItem',
		},
	];

	waypoints.value.forEach((wp, index) => {
		items.push({
			AMSLAltAboveTerrain: amslAltAboveTerrain.value,
			Altitude: waypointAltitude.value,
			AltitudeMode: altitudeMode.value,
			autoContinue: autoContinue.value,
			command: 16, // 16 = waypoint
			doJumpId: index + 2,
			frame: 3,
			params: [0, 0, 0, null, wp.lat, wp.lon, wp.alt],
			type: 'SimpleItem',
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
			0,
		],
		type: 'SimpleItem',
	});

	return {
		fileType: 'Plan',
		groundStation: 'QGroundControl',
		mission: {
			cruiseSpeed: cruiseSpeed.value,
			firmwareType: 3,
			globalPlanAltitudeMode: 0,
			hoverSpeed: hoverSpeed.value,
			items: items,
			plannedHomePosition: plannedHomePosition,
			vehicleType: 2,
			version: 2,
		},
		geoFence: {
			circles: [],
			polygons: [],
			version: 2,
		},
		rallyPoints: {
			points: [],
			version: 2,
		},
		version: 1,
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
	if (isSelected.value) mapStore.disableWaypointSelection();
	clearWaypoints();
	cleanupDatasources();
});
useVisualizationCleanup(dsInstances);
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

		<v-sheet
			class="pa-0 d-flex flex-column"
			v-if="!noController"
		>
      <v-card v-if="minimapViewActive && minimapViz" class="minimap-card">
        <div class="d-flex align-center justify-space-between px-2 pt-1">
          <span class="text-caption font-weight-medium">Mini Map</span>
        </div>
        <PanelVisualizationWrapper :viz="minimapViz" />
      </v-card>
			<v-card class="telemetry-card">
        <div class="d-flex align-center justify-space-between px-4 pt-2">

          <v-card-text class="pa-0">Live Telemetry</v-card-text>
          <v-btn
              :color="minimapViewActive ? 'primary' : 'grey'"
              variant="text"
              density="compact"
              @click="minimapViewActive = !minimapViewActive"
              :prepend-icon="minimapViewActive ? 'mdi-eye' : 'mdi-eye-outline'"
          >
            Mini Map
            <v-tooltip activator="parent" location="top">
              {{ minimapViewActive ? 'Hide mini map' : 'Show mini map' }}
            </v-tooltip>
          </v-btn>
        </div>
				<v-row
            dense
        >
					<v-col
						cols="12"
						md="4"
					>
						<v-card-subtitle>
              Latitude
            </v-card-subtitle>
						<v-card-title>
              {{ receivedLLA.lat.toFixed(6) }}
            </v-card-title>
					</v-col>
					<v-col
						cols="12"
						md="4"
					>
						<v-card-subtitle>
              Longitude
            </v-card-subtitle>
						<v-card-title>
              {{ receivedLLA.lon.toFixed(6) }}
            </v-card-title>
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

			<v-card class="pt-0">
				<v-tabs
					v-model="missionSource"
					grow
					color="primary"
					class="mb-2"
				>
					<v-tab
						value="waypoints"
						prepend-icon="mdi-map-marker-path"
					>
						<span class="d-none d-sm-inline">Build Mission</span>
						<span class="d-sm-none">Waypoints</span>
					</v-tab>
					<v-tab
						value="file"
						prepend-icon="mdi-file-upload"
					>
						<span class="d-none d-sm-inline">Upload Plan</span>
						<span class="d-sm-none">Upload</span>
					</v-tab>
				</v-tabs>

				<v-window v-model="missionSource">
					<v-window-item
						value="waypoints"
						class="my-4"
					>
						<v-form ref="waypointForm">
							<v-row
								dense
								cols="12"
								class="d-flex align-start justify-center"
							>
								<v-col
									cols="auto"
									xs="3"
								>
									<IconButton
										:color="isSelected ? 'primary' : 'grey'"
										@click="toggle"
										:disabled="noController"
										rounded="xl"
									>
										<v-icon>{{
											isSelected ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'
										}}</v-icon>
									</IconButton>
									<v-tooltip
										activator="parent"
										location="top"
									>
										{{
											isSelected
												? 'Click map to add waypoints'
												: 'Enable map selection'
										}}
									</v-tooltip>
								</v-col>
								<v-col
									cols="2.5"
									xs="3"
								>
									<v-text-field
										v-model.number="latInput"
										type="number"
										label="Latitude"
										placeholder="0.0"
										hint="-90 to 90"
										:rules="[
											(v) => (v >= -90 && v <= 90) || 'Must be -90 to 90',
										]"
									/>
								</v-col>
								<v-col
									cols="2.5"
									xs="3"
								>
									<v-text-field
										v-model.number="lonInput"
										type="number"
										label="Longitude"
										placeholder="0.0"
										hint="-180 to 180"
										:rules="[
											(v) => (v >= -180 && v <= 180) || 'Must be -180 to 180',
										]"
									/>
								</v-col>
								<v-col
									cols="2.5"
									xs="3"
								>
									<v-text-field
										v-model.number="altInput"
										type="number"
										label="Altitude"
										placeholder="0.0"
										hide-details
									/>
								</v-col>
								<v-col xs="12">
									<v-btn
										block
										color="primary"
										@click="addWaypoint"
										prepend-icon="mdi-plus"
										variant="flat"
										:disabled="noController"
									>
										Add
									</v-btn>
								</v-col>
							</v-row>
						</v-form>

						<v-expansion-panels class="mt-3">
							<v-expansion-panel title="Waypoint Settings">
								<v-expansion-panel-text>
									<div class="d-flex justify-space-between align-center mb-4">
										<span class="text-subtitle-2"
											>Waypoints ({{ waypoints.length }})</span
										>
										<v-btn
											size="small"
											variant="text"
											color="error"
											@click="showClearConfirm = true"
											:disabled="waypoints.length === 0"
										>
											Clear All
										</v-btn>
										<v-dialog
											v-model="showClearConfirm"
											max-width="400"
										>
											<v-card>
												<v-card-item>
													<v-card-title>Clear All Waypoints</v-card-title>
												</v-card-item>
												<v-card-text>
													Are you sure you want to clear all
													{{ waypoints.length }} waypoints? This action
													cannot be undone.
												</v-card-text>
												<v-card-actions>
													<v-spacer />
													<v-btn
														variant="text"
														@click="showClearConfirm = false"
														>Cancel</v-btn
													>
													<v-btn
														color="error"
														variant="flat"
														@click="clearWaypoints"
														>Clear</v-btn
													>
												</v-card-actions>
											</v-card>
										</v-dialog>
									</div>
									<VueDraggable
										v-if="waypoints.length > 0"
										v-model="waypoints"
										handle=".drag-handle"
										:animation="150"
										class="waypoints-list"
									>
										<v-list-item
											v-for="(wp, index) in waypoints"
											:key="wp.id"
											class="pa-1"
										>
											<template v-slot:prepend>
												<div>
													<v-icon
														class="drag-handle mr-1"
														size="small"
														>mdi-drag</v-icon
													>
													<span class="text-caption w-auto"
														>{{ index + 1 }}.</span
													>
												</div>
											</template>
											<v-list-item-title class="px-2">
												<v-row
													class="align-center"
													density="compact"
												>
													<v-col cols="4">
														<v-text-field
															type="number"
															label="Lat"
															density="compact"
															hide-details
															v-model.number="wp.lat"
														/>
													</v-col>
													<v-col cols="4">
														<v-text-field
															type="number"
															label="Lon"
															density="compact"
															hide-details
															v-model.number="wp.lon"
														/>
													</v-col>
													<v-col cols="4">
														<v-text-field
															type="number"
															label="Alt"
															density="compact"
															hide-details
															v-model.number="wp.alt"
														/>
													</v-col>
												</v-row>
											</v-list-item-title>
											<template v-slot:append>
												<div class="">
													<v-btn
														icon
														size="x-small"
														variant="text"
														@click="removeWaypoint(wp.id)"
													>
														<v-icon size="small"
															>mdi-close-circle</v-icon
														>
														<v-tooltip
															activator="parent"
															location="top"
															>Remove waypoint</v-tooltip
														>
													</v-btn>
												</div>
											</template>
										</v-list-item>
									</VueDraggable>
									<div
										v-else
										class="text-caption text-grey text-center pa-4"
									>
										No waypoints added. Click on the map or use the form above.
									</div>
									<v-divider class="my-4"></v-divider>
									<v-row dense>
										<v-col
											cols="12"
											md="6"
										>
											<v-text-field
												v-model.number="waypointAltitude"
												type="number"
												label="Altitude (m)"
												density="compact"
												hide-details
											/>
										</v-col>
										<v-col
											cols="12"
											md="6"
										>
											<v-text-field
												v-model.number="amslAltAboveTerrain"
												type="number"
												label="AMSL Alt Above Terrain"
												density="compact"
												hide-details
												clearable
											/>
										</v-col>
										<v-col
											cols="12"
											md="6"
										>
											<v-select
												v-model="altitudeMode"
												:items="altitudeModeOptions"
												label="Altitude Mode"
												density="compact"
												hide-details
											/>
										</v-col>
										<v-col
											cols="12"
											md="6"
										>
											<v-checkbox
												v-model="autoContinue"
												label="Auto Continue"
												density="compact"
												color="primary"
												hide-details
											/>
										</v-col>
									</v-row>
								</v-expansion-panel-text>
							</v-expansion-panel>
							<v-expansion-panel title="Planned Home Position">
								<v-expansion-panel-text class="py-2">
									<v-row dense>
										<v-col cols="4">
											<v-card-subtitle>Latitude</v-card-subtitle>
											<v-card-text>{{
												homeLocation.lat.toFixed(6)
											}}</v-card-text>
										</v-col>
										<v-col cols="4">
											<v-card-subtitle>Longitude</v-card-subtitle>
											<v-card-text>{{
												homeLocation.lon.toFixed(6)
											}}</v-card-text>
										</v-col>
										<v-col cols="4">
											<v-card-subtitle>Altitude</v-card-subtitle>
											<v-card-text>{{
												homeLocation.alt.toFixed(2)
											}}</v-card-text>
										</v-col>
									</v-row>
								</v-expansion-panel-text>
							</v-expansion-panel>
							<v-expansion-panel title="Mission Settings">
								<v-expansion-panel-text class="py-2">
									<v-row dense>
										<v-col cols="6">
											<v-text-field
												v-model.number="cruiseSpeed"
												type="number"
												label="Cruise Speed"
												density="compact"
												hide-details
											/>
										</v-col>
										<v-col cols="6">
											<v-text-field
												v-model.number="hoverSpeed"
												type="number"
												label="Hover Speed"
												density="compact"
												hide-details
												clearable
											/>
										</v-col>
									</v-row>
								</v-expansion-panel-text>
							</v-expansion-panel>

							<v-expansion-panel title="GeoFence Settings">
								<v-expansion-panel-text>
									<v-label>Not implemented yet</v-label>
								</v-expansion-panel-text>
							</v-expansion-panel>

							<v-expansion-panel title="Rally Points Settings">
								<v-expansion-panel-text>
									<v-label>Not implemented yet</v-label>
								</v-expansion-panel-text>
							</v-expansion-panel>
						</v-expansion-panels>
					</v-window-item>

					<v-window-item
						value="file"
						class="my-4"
					>
						<v-row dense>
							<v-col cols="12">
								<v-btn
									block
									@click="triggerFileInput"
									prepend-icon="mdi-folder-open"
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

						<v-row
							v-if="selectedFile"
							dense
							class="mt-3"
						>
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

						<div
							v-else
							class="text-caption text-grey text-center pa-4"
						>
							Select a QGroundControl .plan file to upload.
						</div>
					</v-window-item>
				</v-window>
			</v-card>

			<div class="d-flex ga-2">
				<v-btn
					color="primary"
					class="flex-grow-1"
					@click="confirmSendMission"
					:disabled="
						noController ||
						(missionSource === 'waypoints' && waypoints.length === 0) ||
						(missionSource === 'file' && !selectedFile)
					"
					prepend-icon="mdi-send"
				>
					Send Mission
				</v-btn>
				<v-btn
					variant="outlined"
					@click="showExportDialog = true"
					:disabled="
						noController || missionSource !== 'waypoints' || waypoints.length === 0
					"
					prepend-icon="mdi-download"
				>
					Export
				</v-btn>
			</div>

			<v-dialog
				v-model="showExportDialog"
				max-width="400"
			>
				<v-card>
					<v-card-title>Export Mission</v-card-title>
					<v-card-text>
						<v-text-field
							v-model="exportFilename"
							label="Filename"
							suffix=".plan"
							density="compact"
							autofocus
							@keyup.enter="exportMissionPlan"
						/>
					</v-card-text>
					<v-card-actions>
						<v-spacer />
						<v-btn
							variant="text"
							@click="showExportDialog = false"
							>Cancel</v-btn
						>
						<v-btn
							color="primary"
							variant="flat"
							@click="exportMissionPlan"
							prepend-icon="mdi-download"
							>Export</v-btn
						>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog
				v-model="showMissionSummary"
				max-width="500"
			>
				<v-card>
					<v-card-title>Mission Summary</v-card-title>
					<!--				todo: add flight time and distance (using haversine formula for distance. then distance / speed = time)-->
					<v-card-text>
						<v-table density="compact">
							<tbody>
								<tr>
									<td class="font-weight-medium">Source</td>
									<td>
										{{
											missionSource === 'waypoints'
												? 'Waypoints'
												: 'Plan File'
										}}
									</td>
								</tr>
								<tr v-if="missionSource === 'waypoints'">
									<td class="font-weight-medium">Waypoints</td>
									<td>{{ waypoints.length }}</td>
								</tr>
								<tr v-if="missionSource === 'waypoints'">
									<td class="font-weight-medium">Cruise Speed</td>
									<td>{{ cruiseSpeed }} m/s</td>
								</tr>
								<tr v-if="missionSource === 'waypoints'">
									<td class="font-weight-medium">Altitude</td>
									<td>{{ waypointAltitude }} m</td>
								</tr>
								<tr v-if="missionSource === 'file' && selectedFile">
									<td class="font-weight-medium">File</td>
									<td>{{ selectedFile.name }}</td>
								</tr>
							</tbody>
						</v-table>
					</v-card-text>
					<v-card-actions>
						<v-spacer />
						<v-btn
							variant="text"
							@click="showMissionSummary = false"
							>Cancel</v-btn
						>
						<v-btn
							color="primary"
							variant="flat"
							@click="sendMission"
							prepend-icon="mdi-send"
							>Send</v-btn
						>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-card>
				<MissionCommandPad
					:controlstreams="controlstreams"
					class="mt-3"
					v-if="
						getControlstreamByRole('land') ||
						getControlstreamByRole('pause') ||
						getControlstreamByRole('rtl') ||
						getControlstreamByRole('offboard') ||
						getControlstreamByRole('takeoff')
					"
				/>
			</v-card>
		</v-sheet>
	</v-container>
</template>

<style scoped>
.waypoints-list {
	max-height: 125px;
	overflow-y: auto;
}
.drag-handle {
	cursor: grab;
}
.drag-handle:active {
	cursor: grabbing;
}
.minimap-card {
	height: 300px;
	overflow: hidden;
}
</style>
