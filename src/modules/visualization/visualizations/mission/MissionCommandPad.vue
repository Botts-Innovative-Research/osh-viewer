<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { sendCommand } from '../../services/controlstream.service';
import { useMapStore } from '@/stores/mapstore';
import MapPointEditor from '@/components/ui/MapPointEditor.vue';
import { useMapInteractionStore } from '@/stores/mapinteractionstore';
import type { IConSysApiControlStreamProperties } from '../../types/datasource';
import type { MapPoint } from '@/modules/map/types';
import SendButton from "@/components/ui/SendButton.vue";

const props = defineProps<{
	controlstreams: IConSysApiControlStreamProperties[];
}>();

function getControlstreamByRole(role: string) {
	return props.controlstreams.find((cs) => cs.properties && cs.properties[role]);
}

const mapStore = useMapStore();
const mapInteractionStore = useMapInteractionStore();

const driveLocationPoint = ref<MapPoint>({ lat: 0, lon: 0, alt: 0 });
const isDriveLocationMapSelect = computed(() => mapInteractionStore.isDriveLocationSelected);

watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isDriveLocationMapSelect.value && newVal) {
			driveLocationPoint.value = {
				lat: newVal.latitude,
				lon: newVal.longitude,
				alt: newVal.altitude ?? 0,
			};
		}
	}
);

function toggleDriveLocationSelect() {
	mapInteractionStore.toggleTool('driveLocation');
}

const xVelocity = ref(0.0);
const yVelocity = ref(0.0);
const zVelocity = ref(0.0);
const yawRate = ref(0.0);
const takeOffAlt = ref(0.0);
const yawRateDrive = ref(0.0);
const forwardVelocityDrive = ref(0.0);
const offboardForm = ref<any>(null);
const isPaused = ref(false);
const isArmed = ref(false);
const isHold = ref(false);
const driveModes = [
	'MANUAL', 'ACRO', 'STEERING', 'HOLD', 'LOITER',
	'FOLLOW', 'SIMPLE', 'DOCK', 'AUTO', 'RTL', 'GUIDED',
];
const selectedDriveMode = ref('HOLD');

function getControlstreamConfig(cs: IConSysApiControlStreamProperties) {
	if (!cs) return null;
	const protocol = cs.tls ? 'https' : 'http';
	return {
		baseUrl: `${protocol}://${cs.endpointUrl}`,
		id: cs.id,
		auth: `${cs.connectorOpts.username}:${cs.connectorOpts.password}`,
	};
}

function sendCommandToRole(role: string, payload: any) {
	const cs = getControlstreamByRole(role);
	if (!cs) {
		console.warn(`[MissionCommandPad] No controlstream configured for role: ${role}`);
		return;
	}
	const config = getControlstreamConfig(cs);
	if (!config) return;

	console.log(`[MissionCommandPad] Sending command to ${role}:`, payload);
	sendCommand(config.baseUrl, config.id, payload, config.auth);
}

function pause() {
	isPaused.value = !isPaused.value;
	sendCommandToRole('pause', { parameters: { Resume: !isPaused.value } });
}

function arm() {
	isArmed.value = !isArmed.value;
	sendCommandToRole('arm', { parameters: { ARM: isArmed.value } });
}

function hold() {
	isHold.value = !isHold.value;
	sendCommandToRole('hold', { parameters: { engageHold: isHold.value } });
}

function reboot() {
	sendCommandToRole('reboot', { parameters: { reboot: true } });
}

function returnToLaunch() {
	sendCommandToRole('rtl', { parameters: { rtl: true } });
}

function land() {
	sendCommandToRole('land', { parameters: { disarm: true } });
}

function cancel() {
	sendCommandToRole('cancel', { parameters: {} });
}

async function offboard() {
	const { valid } = await offboardForm.value.validate();
	if (!valid) return;

	sendCommandToRole('offboard', {
		parameters: {
			velocity: { vx: xVelocity.value, vy: yVelocity.value, vz: zVelocity.value },
			yawRate: yawRate.value,
		},
	});
}

function takeoffCommand() {
	sendCommandToRole('takeoff', { parameters: { TakeoffAltitudeAGL: takeOffAlt.value } });
}

function driveVelocityCommand() {
	sendCommandToRole('driveVelocity', {
		parameters: { forwardVelocity: forwardVelocityDrive.value, yawRate: yawRateDrive.value },
	});
}

function driveMode() {
	sendCommandToRole('driveMode', { parameters: { mode: selectedDriveMode.value } });
}


function driveLocationCommand(location: MapPoint) {
	sendCommandToRole('driveLocation', {
		parameters: { locationVectorLL: { Latitude: location.lat, Longitude: location.lon } },
	});
}

const hasSimpleCommands = computed(() =>
	['pause', 'rtl', 'land', 'cancel', 'arm', 'hold', 'reboot']
		.some((role) => getControlstreamByRole(role))
);
</script>

<template>
		<div v-if="hasSimpleCommands" class="command-section">

		<v-row class="command-grid pa-2" density="comfortable">
			<v-col v-if="getControlstreamByRole('arm')" cols="4">
				<v-btn
					:color="isArmed ? 'primary' : 'grey'"
					block
					class="command-btn"
					variant="tonal"
					@click="arm"
				>
					<v-icon start>{{ isArmed ? 'mdi-shield-off' : 'mdi-shield-check' }}</v-icon>
					{{ isArmed ? 'Disarm' : 'Arm' }}
					<v-tooltip
						activator="parent"
						location="top"
					>
						Enable motors and prepare for operation. Disarm to disable motors and power
						down.
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col
				v-if="getControlstreamByRole('hold')"
				cols="4"
			>
				<v-btn
					:color="isHold ? 'primary' : 'grey'"
					block
					class="command-btn"
					variant="tonal"
					@click="hold"
				>
					<v-icon start>{{ isHold ? 'mdi-pause-circle-outline' : 'mdi-hand-back-right' }}</v-icon>
					{{ isHold ? 'Release' : 'Hold' }}
					<v-tooltip
						activator="parent"
						location="top"
					>
						Hold current position and stop all movement. Release to resume normal
						control.
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col
				v-if="getControlstreamByRole('pause')"
				cols="4"
			>
				<v-btn
					:color="isPaused ? 'primary' : 'grey'"
					block
					class="command-btn"
					variant="tonal"
					@click="pause"
				>
					<v-icon start>{{ isPaused ? 'mdi-play-circle' : 'mdi-pause-circle' }}</v-icon>
					{{ isPaused ? 'Resume' : 'Pause' }}
					<v-tooltip
						activator="parent"
						location="top"
					>
						Pause the current mission. Resume to continue from where it left off.
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col
				v-if="getControlstreamByRole('rtl')"
				cols="4"
			>
				<v-btn
					block
					class="command-btn"
					color="primary"
					variant="tonal"
					@click="returnToLaunch"
				>
					<v-icon start>mdi-home</v-icon>
					RTL
					<v-tooltip
						activator="parent"
						location="top"
					>
						Return to the launch position and land automatically.
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col
				v-if="getControlstreamByRole('land')"
				cols="4"
			>
				<v-btn
					block
					class="command-btn"
					color="warning"
					variant="tonal"
					@click="land"
				>
					<v-icon start>mdi-airplane-landing</v-icon>
					Land
					<v-tooltip
						activator="parent"
						location="top"
					>
						Land at the current position and disarm motors.
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col
				v-if="getControlstreamByRole('cancel')"
				cols="4"
			>
				<v-btn
					block
					class="command-btn"
					color="error"
					variant="tonal"
					@click="cancel"
				>
					<v-icon start>mdi-cancel</v-icon>
					Cancel
					<v-tooltip
						activator="parent"
						location="top"
					>
						Cancel the current mission or command immediately.
					</v-tooltip>
				</v-btn>
			</v-col>

			<v-col
				v-if="getControlstreamByRole('reboot')"
				cols="4"
			>
				<v-btn
					block
					class="command-btn"
					color="error"
					variant="tonal"
					@click="reboot"
				>
					<v-icon start>mdi-restart</v-icon>
					Reboot
					<v-tooltip
						activator="parent"
						location="top"
					>
						Restart the flight controller. Vehicle must be disarmed.
					</v-tooltip>
				</v-btn>
			</v-col>
		</v-row>
		</div>

		<!-- Drive mode -->
		<div v-if="getControlstreamByRole('driveMode')" class="command-section">
			<div class="section-header">
				<v-icon size="small" class="mr-2">mdi-car</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Drive Mode</span>
				<v-tooltip activator="parent" location="top">
					Sets the ArduRover flight mode for a ground rover or surface
				</v-tooltip>
			</div>
				<v-row
					align="center"
					density="comfortable"
				>
					<v-col cols="8">
						<v-select
							v-model="selectedDriveMode"
							:items="driveModes"
							class="mt-2"
							label="Drive Mode"
						/>
					</v-col>
					<v-col cols="4">
            <SendButton
                @send="driveMode()"
            />
					</v-col>
				</v-row>
		</div>

		<!-- Takeoff control -->
		<div v-if="getControlstreamByRole('takeoff')" class="command-section">
			<div class="section-header">
				<v-icon size="small" class="mr-2">mdi-airplane-takeoff</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Takeoff</span>
				<v-tooltip activator="parent" location="top">
					Set altitude (AGL) and launch the vehicle vertically.
				</v-tooltip>
			</div>
				<v-row
					align="center"
					density="comfortable"
				>
					<v-col cols="4">
						<v-text-field
							v-model.number="takeOffAlt"
							density="compact"
							hide-details
							label="Altitude (AGL)"
							suffix="m"
							type="number"
						/>
					</v-col>
					<v-col cols="4">
            <SendButton
                @send="takeoffCommand()"
            />
					</v-col>
				</v-row>
		</div>

		<!-- Drive velocity control -->
		<div v-if="getControlstreamByRole('driveVelocity')" class="command-section">
			<div class="section-header">
				<v-icon size="small" class="mr-2">mdi-steering</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Drive Velocity</span>
				<v-tooltip activator="parent" location="top">
					Control forward speed and yaw rate for manual driving.
				</v-tooltip>
			</div>
				<v-row
					align="center"
					density="comfortable"
				>
					<v-col cols="4">
						<v-text-field
							v-model.number="forwardVelocityDrive"
							density="compact"
							hide-details
							label="Forward Velocity"
							type="number"
						/>
					</v-col>
					<v-col cols="4">
						<v-text-field
							v-model.number="yawRateDrive"
							density="compact"
							hide-details
							label="Yaw Rate"
							type="number"
						/>
					</v-col>
					<v-col cols="4">
            <SendButton
                @send="driveVelocityCommand()"
            />
					</v-col>
				</v-row>
		</div>

		<!-- Offboard control -->
		<div v-if="getControlstreamByRole('offboard')" class="command-section">
			<div class="section-header">
				<v-icon size="small" class="mr-2">mdi-remote</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Offboard Control</span>
				<v-tooltip activator="parent" location="top">
					Send direct velocity commands and yaw rate for manual flight control.
				</v-tooltip>
			</div>
				<v-form ref="offboardForm">
					<v-row
						align="center"
						density="comfortable"
					>
						<v-col cols="6">
							<v-text-field
								v-model.number="xVelocity"
								density="compact"
								hide-details
								label="Vx"
								type="number"
							/>
						</v-col>
						<v-col cols="6">
							<v-text-field
								v-model.number="yVelocity"
								density="compact"
								hide-details
								label="Vy"
								type="number"
							/>
						</v-col>
						<v-col cols="6">
							<v-text-field
								v-model.number="zVelocity"
								density="compact"
								hide-details
								label="Vz"
								type="number"
							/>
						</v-col>
						<v-col cols="6">
							<v-text-field
								v-model.number="yawRate"
								density="compact"
								hide-details
								label="Yaw"
								type="number"
							/>
						</v-col>
						<v-col cols="6">
              <SendButton
                  @send="offboard()"
              />
						</v-col>
					</v-row>
				</v-form>
    </div>

		<!-- Drive to location -->
		<div v-if="getControlstreamByRole('driveLocation')" class="command-section">
			<div class="section-header">
				<v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Drive to Location</span>
				<v-tooltip activator="parent" location="top">
					Navigate the vehicle to a specific lat/lon coordinate. Use the crosshairs to pick from the map.
				</v-tooltip>
			</div>
				<MapPointEditor
					v-model="driveLocationPoint"
					:is-selected="isDriveLocationMapSelect"
					:is-selector-disabled="false"
					submit-icon="mdi-send"
					submit-label="Send"
					hide-alt
					@submit="driveLocationCommand"
					@toggle="toggleDriveLocationSelect"
				/>
		</div>

</template>

<style scoped>
.command-section {
	border: 1px solid rgba(var(--v-border-color), 0.12);
	border-radius: 8px;
	padding: 8px 12px 12px;
	margin-bottom: 8px;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 6px;
	padding-bottom: 4px;
}

</style>
