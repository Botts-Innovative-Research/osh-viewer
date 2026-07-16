<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { sendCommand } from '../../services/controlstream.service';
import { useMapStore } from '@/stores/mapstore';
import LocationPicker from '@/components/ui/LocationPicker.vue';

const props = defineProps({
	controlstreams: {
		type: Array,
		required: true,
		default: () => [],
	},
});

function getControlstreamByRole(role: string) {
	return props.controlstreams.find((cs: any) => cs.properties && cs.properties[role]);
}

const mapStore = useMapStore();

const driveLocationPickerRef = ref<InstanceType<typeof LocationPicker> | null>(null);
const isDriveLocationMapSelect = computed(() => mapStore.isDriveLocationSelected);

const homeLocationPickerRef = ref<InstanceType<typeof LocationPicker> | null>(null);
const isHomeLocationMapSelect = computed(() => mapStore.isHomeLocationSelected);

watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isDriveLocationMapSelect.value && newVal) {
			driveLocationPickerRef.value?.setLatLonAlt(newVal.latitude, newVal.longitude, 0);
		}
		if (isHomeLocationMapSelect.value && newVal) {
			homeLocationPickerRef.value?.setLatLonAlt(newVal.latitude, newVal.longitude, 0);
		}
	}
);

function toggleDriveLocationSelect() {
	mapStore.setIsDriveLocationSelected(!mapStore.isDriveLocationSelected);
}

function toggleHomeLocationSelect() {
	mapStore.setIsHomeLocationSelected(!mapStore.isHomeLocationSelected);
}

const xVelocity = ref<number>(0.0);
const yVelocity = ref<number>(0.0);
const zVelocity = ref<number>(0.0);
const yawRate = ref<number>(0.0);
const takeOffAlt = ref<number>(0.0);
const yawRateDrive = ref<number>(0.0);
const forwardVelocityDrive = ref<number>(0.0);
const offboardForm = ref<any>(null);
const isPaused = ref(false);
const isArmed = ref(false);
const isHold = ref(false);
const driveModes = ref([
	'MANUAL',
	'ACRO',
	'STEERING',
	'HOLD',
	'LOITER',
	'FOLLOW',
	'SIMPLE',
	'DOCK',
	'AUTO',
	'RTL',
	'GUIDED',
]);
const selectedDriveMode = ref('HOLD');

function getControlstreamConfig(cs: any) {
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
	// resume = true , pause = false
	const payload = {
		parameters: {
			Resume: isPaused.value,
		},
	};

	sendCommandToRole('pause', payload);
}

function arm() {
	isArmed.value = !isArmed.value;
	// arm = true , disarm = false
	const payload = {
		parameters: {
			ARM: isArmed.value,
		},
	};

	sendCommandToRole('arm', payload);
}

function hold() {
	isHold.value = !isHold.value;
	const payload = {
		parameters: {
			engageHold: isHold.value,
		},
	};

	sendCommandToRole('hold', payload);
}

function reboot() {
	const payload = {
		parameters: {
			reboot: true,
		},
	};

	sendCommandToRole('reboot', payload);
}

function returnToLaunch() {
	const payload = {
		parameters: {
			rtl: true,
		},
	};
	sendCommandToRole('rtl', payload);
}

function land() {
	const payload = {
		parameters: {
			disarm: true,
		},
	};
	sendCommandToRole('land', payload);
}

function cancel() {
	const payload = {
		parameters: {},
	};
	sendCommandToRole('cancel', payload);
}

async function offboard() {
	const { valid } = await offboardForm.value.validate();
	if (!valid) return;

	const payload = {
		parameters: {
			velocity: {
				vx: xVelocity.value,
				vy: yVelocity.value,
				vz: zVelocity.value,
			},
			yawRate: yawRate.value,
		},
	};

	sendCommandToRole('offboard', payload);
}

function takeoffCommand() {
	const payload = {
		parameters: {
			TakeoffAltitudeAGL: takeOffAlt.value,
		},
	};

	sendCommandToRole('takeoff', payload);
}

function driveVelocityCommand() {
	const payload = {
		parameters: {
			forwardVelocity: forwardVelocityDrive.value,
			yawRate: yawRateDrive.value,
		},
	};

	sendCommandToRole('driveVelocity', payload);
}

function driveMode() {
	const payload = {
		parameters: {
			mode: selectedDriveMode.value,
		},
	};
	sendCommandToRole('driveMode', payload);
}

function homePositionCommand(location: { lat: number; lon: number }) {
	const payload = {
		parameters: {
			locationVectorLL: {
				Latitude: location.lat,
				Longitude: location.lon,
			},
		},
	};

	sendCommandToRole('homePos', payload);
}

function driveLocationCommand(location: { lat: number; lon: number; alt: number }) {
	const payload = {
		parameters: {
			locationVectorLL: {
				Latitude: location.lat,
				Longitude: location.lon,
			},
		},
	};

	sendCommandToRole('driveLocation', payload);
}
</script>

<template>
	<v-expansion-panels multiple>
		<!--commands-->
		<v-row
			v-if="
				getControlstreamByRole('pause') ||
				getControlstreamByRole('rtl') ||
				getControlstreamByRole('land') ||
				getControlstreamByRole('cancel') ||
				getControlstreamByRole('arm') ||
				getControlstreamByRole('hold') ||
				getControlstreamByRole('reboot')
			"
			density="comfortable"
		>
			<v-col
				v-if="getControlstreamByRole('arm')"
				cols="4"
			>
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
					<v-icon start>{{ isHold ? 'mdi-shield-off' : 'mdi-shield-check' }}</v-icon>
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

		<!--drive mode-->
		<v-expansion-panel v-if="getControlstreamByRole('driveMode')">
			<v-expansion-panel-title>
				<v-icon
					class="mr-2"
					size="small"
					>mdi-car</v-icon
				>
				<span class="text-subtitle-2 font-weight-medium">Drive Mode Control</span>
				<v-tooltip
					activator="parent"
					location="top"
				>
					Sets the ArduRover flight mode for a ground rover or surface
				</v-tooltip>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
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
						<v-btn
							block
							class="command-btn"
							color="primary"
							variant="tonal"
							@click="driveMode"
						>
							<v-icon start>mdi-send</v-icon>
							Send
						</v-btn>
					</v-col>
				</v-row>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<!--takeoff control-->
		<v-expansion-panel v-if="getControlstreamByRole('takeoff')">
			<v-expansion-panel-title>
				<v-icon
					class="mr-2"
					size="small"
					>mdi-airplane</v-icon
				>
				<span class="text-subtitle-2 font-weight-medium">Takeoff Control</span>
				<v-tooltip
					activator="parent"
					location="top"
				>
					Set altitude (AGL) and launch the vehicle vertically.
				</v-tooltip>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
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
						<v-btn
							block
							class="command-btn"
							color="primary"
							variant="tonal"
							@click="takeoffCommand"
						>
							<v-icon start>mdi-airplane-takeoff</v-icon>
							Take Off
						</v-btn>
					</v-col>
				</v-row>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<!--drive velocity control-->
		<v-expansion-panel v-if="getControlstreamByRole('driveVelocity')">
			<v-expansion-panel-title>
				<v-icon
					class="mr-2"
					size="small"
					>mdi-steering</v-icon
				>
				<span class="text-subtitle-2 font-weight-medium">Drive Velocity Control</span>
				<v-tooltip
					activator="parent"
					location="top"
				>
					Control forward speed and yaw rate for manual driving.
				</v-tooltip>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
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
						<v-btn
							block
							class="command-btn"
							color="primary"
							variant="tonal"
							@click="driveVelocityCommand"
						>
							<v-icon start>mdi-send</v-icon>
							Send
						</v-btn>
					</v-col>
				</v-row>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<!--offboard control-->
		<v-expansion-panel v-if="getControlstreamByRole('offboard')">
			<v-expansion-panel-title>
				<v-icon
					class="mr-2"
					size="small"
					>mdi-controller</v-icon
				>
				<span class="text-subtitle-2 font-weight-medium">Offboard Control</span>
				<v-tooltip
					activator="parent"
					location="top"
				>
					Send direct velocity commands and yaw rate for manual flight control.
				</v-tooltip>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
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
							<v-btn
								block
								class="command-btn"
								color="primary"
								variant="tonal"
								@click="offboard"
							>
								<v-icon start>mdi-send</v-icon>
								Send
							</v-btn>
						</v-col>
					</v-row>
				</v-form>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<!--drive to location-->
		<v-expansion-panel v-if="getControlstreamByRole('driveLocation')">
			<v-expansion-panel-title>
				<v-icon
					class="mr-2"
					size="small"
					>mdi-map-marker</v-icon
				>
				<span class="text-subtitle-2 font-weight-medium">Drive to Location</span>
				<v-tooltip
					activator="parent"
					location="top"
				>
					Navigate the vehicle to a specific lat/lon coordinate. Use the crosshairs to
					pick from the map.
				</v-tooltip>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<LocationPicker
					ref="driveLocationPickerRef"
					:is-selected="isDriveLocationMapSelect"
					button-icon="mdi-send"
					button-label="Send"
					hide-alt
					@submit="driveLocationCommand"
					@toggle="toggleDriveLocationSelect"
				/>
			</v-expansion-panel-text>
		</v-expansion-panel>

		<v-expansion-panel v-if="getControlstreamByRole('homePos')">
			<v-expansion-panel-title>
				<v-icon
					class="mr-2"
					size="small"
					>mdi-home</v-icon
				>
				<span class="text-subtitle-2 font-weight-medium">Home Location</span>
				<v-tooltip
					activator="parent"
					location="top"
				>
					Update the vehicles home location. Use the crosshairs to pick from the map.
				</v-tooltip>
			</v-expansion-panel-title>
			<v-expansion-panel-text>
				<LocationPicker
					ref="homeLocationPickerRef"
					:is-selected="isHomeLocationMapSelect"
					button-icon="mdi-send"
					button-label="Send"
					hide-alt
					@submit="homePositionCommand"
					@toggle="toggleHomeLocationSelect"
				/>
			</v-expansion-panel-text>
		</v-expansion-panel>
	</v-expansion-panels>
</template>

<style scoped>
.command-btn {
	text-transform: none;
	font-weight: 500;
	transition: all 0.2s ease;
}

.command-btn:hover {
	transform: translateY(-1px);
	filter: brightness(1.2);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
