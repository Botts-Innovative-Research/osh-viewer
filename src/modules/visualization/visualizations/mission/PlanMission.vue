<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
import MissionSummaryDialog from './MissionSummaryDialog.vue';
import SaveMissionDialog from './SaveMissionDialog.vue';
import DeleteMissionDialog from './DeleteMissionDialog.vue';
import ExportMissionDialog from './ExportMissionDialog.vue';
import type { MissionSettings, SavedMission, Waypoint } from './types';
import type { IConSysApiControlStreamProperties } from '../../types/datasource';
import DeleteButton from '@/components/ui/DeleteButton.vue';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import { MapPoint } from '@/modules/map/types';

const props = defineProps<{
	noController: boolean;
	homeLocation: { lat: number; lon: number; alt: number };
	isActive: boolean;
	missionControlStream?: IConSysApiControlStreamProperties;
	systemId: string;
}>();

const emit = defineEmits<{
	setHome: [location: { lat: number; lon: number }];
}>();

const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();
const missionStore = useMissionStore();

const missionSource = ref<'waypoints' | 'file' | 'saved'>('waypoints');
const waypoints = ref<Waypoint[]>([]);
const waypointBuilderRef = ref<InstanceType<typeof MissionWaypointBuilder> | null>(null);
const fileInputRef = ref<any | null>(null);
const selectedFile = ref<File | null>(null);

const vehicleType = ref<string>('');
const cruiseSpeed = ref<number>(5);
const hoverSpeed = ref<number>(2);
const waypointAltitude = ref<number>(25);
const altitudeMode = ref<number>(0);
const autoContinue = true;
const amslAltAboveTerrain = null;
const geoFenceCircles = ref<[]>([]);
const geoFencePolygons = ref<[]>([]);
const rallyPoints = ref<[]>([]);

const isRover = computed(
	() => vehicleType.value === 'Ground Rover' || vehicleType.value === 'Surface Boat'
);
const hasHomeLocation = computed(
	() => props.homeLocation?.lat != null && props.homeLocation?.lon != null
);

const qgcVehicleTypeMap: Record<string, number> = {
	UAV: 2,
	'Ground Rover': 10,
	'Surface Boat': 11,
	Submarine: 12,
};

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
		if (isSelected.value && props.isActive && newVal) {
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
			})),
			props.systemId
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

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const totalDistance = computed(() => {
	let total = 0;
	for (let i = 0; i < waypoints.value.length - 1; i++) {
		const a = waypoints.value[i],
			b = waypoints.value[i + 1];
		const ground = haversineDistance(a.lat, a.lon, b.lat, b.lon);
		const altDiff = (b.alt || 0) - (a.alt || 0);
		total += Math.sqrt(ground ** 2 + altDiff ** 2);
	}
	return total;
});

const estimatedTime = computed(() => {
	if (cruiseSpeed.value <= 0) return 0;
	return totalDistance.value / cruiseSpeed.value;
});

function confirmSendMission() {
	showMissionSummary.value = true;
}

function clearWaypoints() {
	waypoints.value = [];
	missionStore.clearSystemWaypoints(props.systemId);
}

function onClearWaypoints() {
	missionStore.clearSystemWaypoints(props.systemId);
}

function getCurrentSettings(): MissionSettings {
	return {
		vehicleType: vehicleType.value,
		cruiseSpeed: cruiseSpeed.value,
		hoverSpeed: hoverSpeed.value,
		waypointAltitude: waypointAltitude.value,
		altitudeMode: altitudeMode.value,
		autoContinue,
		amslAltAboveTerrain,
	};
}

function saveCurrentMission(name: string, desc: string) {
	if (waypoints.value.length === 0) {
		showToast('No waypoints to save', 'ERROR');
		return;
	}

	const mission: SavedMission = {
		id: randomUUID(),
		name,
		desc,
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

	vehicleType.value = mission.settings.vehicleType ?? '';
	cruiseSpeed.value = mission.settings.cruiseSpeed;
	hoverSpeed.value = mission.settings.hoverSpeed;
	waypointAltitude.value = mission.settings.waypointAltitude;
	altitudeMode.value = mission.settings.altitudeMode;

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

function exportMissionPlan(exportName: string) {
	const plan = generateMissionControlPlan();
	if (!plan) {
		showToast('No waypoints to export', 'ERROR');
		return;
	}
	const filename = exportName.endsWith('.plan') ? exportName : exportName + '.plan';
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

	if (!hasHomeLocation.value) {
		showToast('Home location must be set before sending a mission', 'ERROR');
		return null;
	}

	const plannedHomePosition = [
		props.homeLocation.lat,
		props.homeLocation.lon,
		props.homeLocation.alt,
	];

	const items: any[] = [];

	if (!isRover.value) {
		const takeoffLocation = props.homeLocation;
		items.push({
			AMSLAltAboveTerrain: amslAltAboveTerrain,
			Altitude: waypointAltitude.value,
			AltitudeMode: altitudeMode.value,
			autoContinue,
			command: 22,
			doJumpId: 1,
			frame: 3,
			params: [0, 0, 0, null, takeoffLocation.lat, takeoffLocation.lon, takeoffLocation.alt],
			type: 'SimpleItem',
		});
	}

	waypoints.value.forEach((wp) => {
		items.push({
			AMSLAltAboveTerrain: isRover.value ? 0 : (amslAltAboveTerrain ?? 0),
			Altitude: isRover.value ? 0 : waypointAltitude.value,
			AltitudeMode: isRover.value ? 0 : altitudeMode.value,
			autoContinue,
			command: 16,
			doJumpId: items.length + 1,
			frame: isRover.value ? 0 : 3,
			params: [0, 0, 0, null, wp.lat, wp.lon, isRover.value ? 0 : wp.alt],
			type: 'SimpleItem',
		});
	});

	if (!isRover.value) {
		items.push({
			AMSLAltAboveTerrain: amslAltAboveTerrain,
			Altitude: 0,
			AltitudeMode: altitudeMode.value,
			autoContinue,
			command: 21,
			doJumpId: items.length + 1,
			frame: 3,
			params: [0, 0, 0, null, props.homeLocation.lat, props.homeLocation.lon, 0],
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
			hoverSpeed: isRover.value ? 0 : hoverSpeed.value,
			items: items,
			plannedHomePosition: plannedHomePosition,
			vehicleType: qgcVehicleTypeMap[vehicleType.value] ?? 2,
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

onMounted(() => {
	// Repopulate waypoints with persisted system waypoints
	waypoints.value = missionStore
		.getMissionWaypointsPerSystem(props.systemId)
		.map((point: MapPoint) => {
			return {
				id: randomUUID(),
				lat: point.lat,
				lon: point.lon,
				alt: point.alt,
			};
		});
});
defineExpose({
	sendMission,
	waypoints,
	vehicleType,
	cruiseSpeed,
	waypointAltitude,
	totalDistance,
	estimatedTime,
});
onBeforeUnmount(() => {
	mapInteractionStore.deselectTool('missionWaypoint');
	// clearWaypoints();
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
			<span class="d-sm-none">Build</span>
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
			<span class="d-none d-sm-inline">Mission Library</span>
			<span class="d-sm-none">Mission Library</span>
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
				v-model:cruiseSpeed="cruiseSpeed"
				v-model:hoverSpeed="hoverSpeed"
				v-model:vehicleType="vehicleType"
				v-model:waypointAltitude="waypointAltitude"
				v-model:waypoints="waypoints"
				:home-location="homeLocation"
				:is-selected="isSelected"
				:no-controller="noController"
				@toggle="toggle"
				@clear-waypoints="onClearWaypoints"
				@set-home="(loc) => emit('setHome', loc)"
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

						<DeleteButton
							label="Remove"
							@delete="confirmDeleteMission(mission.id)"
						></DeleteButton>
					</template>
				</v-list-item>
			</v-list>
			<div
				v-else
				class="text-center"
			>
				<v-card-text> No Missions Saved </v-card-text>
				<v-card-subtitle>
					Plan a mission and use “Save current mission” to add it to your library.
				</v-card-subtitle>
			</div>
		</v-window-item>
	</v-window>

	<div class="d-flex ga-2">
		<v-btn
			:disabled="
				noController ||
				!vehicleType ||
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
				Save current mission
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
				Download mission as .plan file
			</v-tooltip>
		</v-btn>
	</div>

	<ExportMissionDialog
		v-model="showExportDialog"
		@export="exportMissionPlan"
	/>

	<MissionSummaryDialog
		v-model="showMissionSummary"
		:missions="[
			{
				name: props.systemId,
				missionSource,
				vehicleType: vehicleType,
				waypointCount: waypoints.length,
				cruiseSpeed,
				waypointAltitude,
				totalDistance,
				estimatedTime,
				selectedFileName: selectedFile?.name,
			},
		]"
		@send="sendMission"
	/>

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
