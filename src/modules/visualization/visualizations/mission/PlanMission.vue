<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
// @ts-ignore
import { randomUUID } from 'osh-js/source/core/utils/Utils.js';
import { useMapStore } from '@/stores/mapstore';
import { useMissionStore } from '@/stores/missionstore';
import { showToast } from '@/composables/useToast';
import {
	fetchCsSchema,
	mineControlObsPropsFromCS,
	sendCommand,
} from '../../services/controlstream.service';
import MissionWaypointBuilder from './MissionWaypointBuilder.vue';
import SaveMissionDialog from './SaveMissionDialog.vue';
import DeleteMissionDialog from './DeleteMissionDialog.vue';
import type { MissionSettings, SavedMission, Waypoint } from './types';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';

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
	isRover: boolean;
	noController: boolean;
	homeLocation: { lat: number; lon: number; alt: number };
	missionControlStream?: Controlstream;
}>();

const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();
const missionStore = useMissionStore();

const missionSource = ref<'waypoints' | 'file' | 'saved'>('waypoints');
const waypoints = ref<Waypoint[]>([]);
const waypointBuilderRef = ref<InstanceType<typeof MissionWaypointBuilder> | null>(null);
const fileInputRef = ref<any | null>(null);
const selectedFile = ref<File | null>(null);
const exportFilename = ref<string>('mission');

const cruiseSpeed = ref<number>(0.25);
const hoverSpeed = ref<number>(0.25);
const waypointAltitude = ref<number>(25);
const altitudeMode = ref<number>(1);
const autoContinue = ref<boolean>(true);
const amslAltAboveTerrain = ref<number | null>(null);

const isSelected = ref<boolean>(false);
const showMissionSummary = ref(false);
const showExportDialog = ref(false);
const showSaveDialog = ref(false);
const showDeleteMissionConfirm = ref(false);
const missionToDelete = ref<string | null>(null);

const commandBaseUrl = computed(() => {
	const cs = props.missionControlStream;
	if (!cs) return '';
	const protocol = cs.tls ? 'https' : 'http';
	return `${protocol}://${cs.endpointUrl}`;
});

const csAuth = computed(() => {
	const cs = props.missionControlStream;
	if (!cs) return { username: '', password: '' };
	return { username: cs.connectorOpts.username, password: cs.connectorOpts.password };
});

watch(
	() => mapInteractionStore.isMissionWaypointSelected,
	(selected) => {
		isSelected.value = selected;
	}
);

watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isSelected.value && newVal) {
			missionSource.value = 'waypoints';
			waypointBuilderRef.value?.setLatLonAlt(
				newVal.latitude,
				newVal.longitude,
				waypointAltitude.value
			);
		}
	}
);

watch(
	waypoints,
	(newWaypoints) => {
		missionStore.setMissionWaypoints(
			newWaypoints.map((wp) => ({
				lat: wp.lat,
				lon: wp.lon,
				alt: wp.alt,
			}))
		);
	},
	{ deep: true }
);

function toggle() {
	const cs = props.missionControlStream;
	if (isSelected.value) {
		mapInteractionStore.deselectTool('missionWaypoint');
	} else if (cs) {
		mapInteractionStore.selectTool('missionWaypoint');
	}
}

function confirmSendMission() {
	showMissionSummary.value = true;
}

function clearWaypoints() {
	waypoints.value = [];
	missionStore.clearMissionWaypoints();
}

function onClearWaypoints() {
	missionStore.clearMissionWaypoints();
}

function getCurrentSettings(): MissionSettings {
	return {
		cruiseSpeed: cruiseSpeed.value,
		hoverSpeed: hoverSpeed.value,
		waypointAltitude: waypointAltitude.value,
		altitudeMode: altitudeMode.value,
		autoContinue: autoContinue.value,
		amslAltAboveTerrain: amslAltAboveTerrain.value,
	};
}

function saveCurrentMission(name: string) {
	if (waypoints.value.length === 0) {
		showToast('No waypoints to save', 'ERROR');
		return;
	}

	const mission: SavedMission = {
		id: randomUUID(),
		name,
		waypoints: waypoints.value.map((wp) => ({ ...wp })),
		settings: getCurrentSettings(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	missionStore.saveMission(mission);
	showToast(`Mission "${name}" saved`, 'SUCCESS');
	showSaveDialog.value = false;
}

function loadMission(mission: SavedMission) {
	clearWaypoints();

	cruiseSpeed.value = mission.settings.cruiseSpeed;
	hoverSpeed.value = mission.settings.hoverSpeed;
	waypointAltitude.value = mission.settings.waypointAltitude;
	altitudeMode.value = mission.settings.altitudeMode;
	autoContinue.value = mission.settings.autoContinue;
	amslAltAboveTerrain.value = mission.settings.amslAltAboveTerrain;

	waypoints.value = mission.waypoints.map((wp) => ({ ...wp }));

	missionSource.value = 'waypoints';

	showToast(`Loaded mission "${mission.name}"`, 'SUCCESS');
}

function confirmDeleteMission(id: string) {
	missionToDelete.value = id;
	showDeleteMissionConfirm.value = true;
}

function deleteSavedMission() {
	if (missionToDelete.value) {
		missionStore.deleteMission(missionToDelete.value);
		showToast('Mission deleted', 'SUCCESS');
	}
	showDeleteMissionConfirm.value = false;
	missionToDelete.value = null;
}

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
	const cs = props.missionControlStream;
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
		console.warn('[PlanMission] Could not fetch schema, using structured format:', e);
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

	const cs = props.missionControlStream;
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
		'[PlanMission] Sending mission command:',
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
		console.warn('[PlanMission] No file selected');
		return;
	}

	const cs = props.missionControlStream;
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
		console.error('[PlanMission] Failed to parse plan file:', err);
		return;
	}

	const parameters = buildCommandParameters(plan);
	const legacy = await isLegacyPlanSchema();
	const command = {
		parameters: legacy ? { plan: JSON.stringify(parameters) } : parameters,
	};

	console.log(
		'[PlanMission] Sending mission file command:',
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
		console.warn('[PlanMission] No waypoints to generate plan');
		return null;
	}

	const plannedHomePosition = [
		props.homeLocation?.lat ?? waypoints.value[0].lat,
		props.homeLocation?.lon ?? waypoints.value[0].lon,
		props.homeLocation?.alt ?? waypoints.value[0].alt,
	];

	const items: any[] = [];

	if (!props.isRover) {
		const takeoffLocation = props.homeLocation ?? waypoints.value[0];
		items.push({
			AMSLAltAboveTerrain: amslAltAboveTerrain.value,
			Altitude: waypointAltitude.value,
			AltitudeMode: altitudeMode.value,
			autoContinue: autoContinue.value,
			command: 22,
			doJumpId: 1,
			frame: 3,
			params: [0, 0, 0, null, takeoffLocation.lat, takeoffLocation.lon, takeoffLocation.alt],
			type: 'SimpleItem',
		});
	}

	waypoints.value.forEach((wp) => {
		items.push({
			AMSLAltAboveTerrain: props.isRover ? 0 : (amslAltAboveTerrain.value ?? 0),
			Altitude: props.isRover ? 0 : waypointAltitude.value,
			AltitudeMode: props.isRover ? 0 : altitudeMode.value,
			autoContinue: autoContinue.value,
			command: 16,
			doJumpId: items.length + 1,
			frame: props.isRover ? 0 : 3,
			params: [0, 0, 0, null, wp.lat, wp.lon, props.isRover ? 0 : wp.alt],
			type: 'SimpleItem',
		});
	});

	if (!props.isRover) {
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
				props.homeLocation?.lat ?? waypoints.value[0].lat,
				props.homeLocation?.lon ?? waypoints.value[0].lon,
				0,
			],
			type: 'SimpleItem',
		});
	}

	return {
		fileType: 'Plan',
		groundStation: 'QGroundControl',
		mission: {
			cruiseSpeed: cruiseSpeed.value,
			firmwareType: 3,
			globalPlanAltitudeMode: 0,
			hoverSpeed: props.isRover ? 0 : hoverSpeed.value,
			items: items,
			plannedHomePosition: plannedHomePosition,
			vehicleType: props.isRover ? 10 : 2,
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

onBeforeUnmount(() => {
	mapInteractionStore.deselectTool('missionWaypoint');
	clearWaypoints();
});
</script>

<template>
	<v-tabs
		v-model="missionSource"
		class="mb-2"
		color="primary"
		grow
	>
		<v-tab
			prepend-icon="mdi-map-marker-path"
			value="waypoints"
		>
			<span class="d-none d-sm-inline">Build</span>
			<span class="d-sm-none">Waypoints</span>
		</v-tab>
		<v-tab
			prepend-icon="mdi-file-upload"
			value="file"
		>
			<span class="d-none d-sm-inline">Upload</span>
			<span class="d-sm-none">Upload</span>
		</v-tab>
		<v-tab
			prepend-icon="mdi-content-save-all"
			value="saved"
		>
			<span class="d-none d-sm-inline">Saved</span>
			<span class="d-sm-none">Saved</span>
		</v-tab>
	</v-tabs>

	<v-window v-model="missionSource">
		<v-window-item
			class="my-4"
			value="waypoints"
		>
			<MissionWaypointBuilder
				ref="waypointBuilderRef"
				v-model:altitudeMode="altitudeMode"
				v-model:amslAltAboveTerrain="amslAltAboveTerrain"
				v-model:autoContinue="autoContinue"
				v-model:cruiseSpeed="cruiseSpeed"
				v-model:hoverSpeed="hoverSpeed"
				v-model:waypointAltitude="waypointAltitude"
				v-model:waypoints="waypoints"
				:home-location="homeLocation"
				:is-rover="isRover"
				:is-selected="isSelected"
				:no-controller="noController"
				@toggle="toggle"
				@clear-waypoints="onClearWaypoints"
			/>
		</v-window-item>

		<v-window-item
			class="my-4"
			value="file"
		>
			<v-row density="comfortable">
				<v-col cols="12">
					<v-btn
						block
						prepend-icon="mdi-folder-open"
						variant="outlined"
						@click="triggerFileInput"
					>
						Browse Files
					</v-btn>
					<input
						ref="fileInputRef"
						accept=".plan"
						style="display: none"
						type="file"
						@change="handleFileChange"
					/>
				</v-col>
			</v-row>

			<v-row
				v-if="selectedFile"
				class="mt-3"
				density="comfortable"
			>
				<v-col cols="12">
					<v-alert
						closable
						density="compact"
						type="info"
						variant="tonal"
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

		<v-window-item
			class="my-4"
			value="saved"
		>
			<v-list
				v-if="missionStore.savedMissions.length > 0"
				class="saved-missions-list"
				density="compact"
			>
				<v-list-item
					v-for="mission in missionStore.savedMissions"
					:key="mission.id"
					class="pa-2"
				>
					<v-list-item-title class="font-weight-medium">
						{{ mission.name }}
					</v-list-item-title>
					<v-list-item-subtitle>
						{{ mission.waypoints.length }} waypoints
					</v-list-item-subtitle>
					<template v-slot:append>
						<v-btn
							icon
							size="x-small"
							variant="text"
							@click="loadMission(mission)"
						>
							<v-icon size="small">mdi-upload</v-icon>
							<v-tooltip
								activator="parent"
								location="top"
								>Load mission</v-tooltip
							>
						</v-btn>
						<v-btn
							icon
							size="x-small"
							variant="text"
							@click="confirmDeleteMission(mission.id)"
						>
							<v-icon size="small">mdi-window-close</v-icon>
							<v-tooltip
								activator="parent"
								location="top"
								>Delete mission</v-tooltip
							>
						</v-btn>
					</template>
				</v-list-item>
			</v-list>
			<div
				v-else
				class="text-caption text-grey text-center pa-4"
			>
				No saved missions yet. Build a mission and save it here.
			</div>
		</v-window-item>
	</v-window>

	<div class="d-flex ga-2">
		<v-btn
			:disabled="
				noController ||
				(missionSource === 'waypoints' && waypoints.length === 0) ||
				(missionSource === 'file' && !selectedFile) ||
				missionSource === 'saved'
			"
			class="flex-grow-1"
			color="primary"
			prepend-icon="mdi-send"
			variant="tonal"
			@click="confirmSendMission"
		>
			Send Mission
		</v-btn>

		<v-btn
			:disabled="noController || waypoints.length === 0"
			icon
			@click="showSaveDialog = true"
		>
			<v-icon>mdi-content-save</v-icon>
			<v-tooltip
				activator="parent"
				location="bottom"
			>
				Save Mission
			</v-tooltip>
		</v-btn>

		<v-btn
			:disabled="noController || missionSource !== 'waypoints' || waypoints.length === 0"
			icon
			@click="showExportDialog = true"
		>
			<v-icon>mdi-download</v-icon>
			<v-tooltip
				activator="parent"
				location="bottom"
			>
				Download Mission as .plan file
			</v-tooltip>
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
					autofocus
					density="compact"
					label="Filename"
					suffix=".plan"
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
					prepend-icon="mdi-download"
					variant="flat"
					@click="exportMissionPlan"
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
			<v-card-text>
				<v-table density="compact">
					<tbody>
						<tr>
							<td class="font-weight-medium">Source</td>
							<td>
								{{ missionSource === 'waypoints' ? 'Waypoints' : 'Plan File' }}
							</td>
						</tr>
						<tr v-if="missionSource === 'waypoints'">
							<td class="font-weight-medium">Waypoints</td>
							<td>{{ waypoints.length }}</td>
						</tr>
						<tr v-if="missionSource === 'waypoints'">
							<td class="font-weight-medium">
								{{ isRover ? 'Ground Speed' : 'Cruise Speed' }}
							</td>
							<td>{{ cruiseSpeed }} m/s</td>
						</tr>
						<tr v-if="missionSource === 'waypoints'">
							<td class="font-weight-medium">Vehicle Type</td>
							<td>{{ isRover ? 'Rover' : 'UAV' }}</td>
						</tr>
						<tr v-if="missionSource === 'waypoints' && !isRover">
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
					prepend-icon="mdi-send"
					variant="flat"
					@click="sendMission"
					>Send</v-btn
				>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<SaveMissionDialog
		v-model="showSaveDialog"
		:waypoint-count="waypoints.length"
		@save="saveCurrentMission"
	/>

	<DeleteMissionDialog
		v-model="showDeleteMissionConfirm"
		@confirm="deleteSavedMission"
	/>
</template>

<style scoped>
.saved-missions-list {
	max-height: 200px;
	overflow-y: auto;
}
</style>
