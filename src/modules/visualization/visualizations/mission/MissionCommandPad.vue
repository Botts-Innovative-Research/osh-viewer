<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { sendCommand } from '../../services/controlstream.service';
import { useMapStore } from '@/stores/mapstore';

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

const driveLat = ref<number>(0.0);
const driveLon = ref<number>(0.0);
const isDriveLocationMapSelect = computed(() => mapStore.isDriveLocationSelected);

watch(
	() => mapStore.currentLLA,
	(newVal) => {
		if (isDriveLocationMapSelect.value && newVal) {
			driveLat.value = newVal.latitude;
			driveLon.value = newVal.longitude;
		}
	}
);

function toggleDriveLocationSelect() {
	mapStore.setIsDriveLocationSelected(!mapStore.isDriveLocationSelected);
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

function driveLocationCommand() {
	const payload = {
		parameters: {
			locationVectorLL: {
				Latitude: driveLat.value,
				Longitude: driveLon.value,
			}
		},
	};

	sendCommandToRole('driveLocation', payload);
}
</script>

<template>
	<div>
		<!--commands-->
		<div
			v-if="
				getControlstreamByRole('pause') ||
				getControlstreamByRole('rtl') ||
				getControlstreamByRole('land') ||
				getControlstreamByRole('cancel')
			"
		>
			<div class="section-header mb-3">
				<v-icon size="small" class="mr-2">mdi-gamepad-variant</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Commands</span>
			</div>
			<v-row density="comfortable">
				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('arm')"
				>
					<v-btn
						block
						variant="tonal"
						:color="isArmed ? 'primary' : 'grey'"
						@click="arm"
						class="command-btn"
					>
						<v-icon start>{{ isArmed ? 'mdi-shield-off' : 'mdi-shield-check' }}</v-icon>
						{{ isArmed ? 'Disarm' : 'Arm' }}
					</v-btn>
				</v-col>

				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('pause')"
				>
					<v-btn
						block
						variant="tonal"
						:color="isPaused ? 'primary' : 'grey'"
						@click="pause"
						class="command-btn"
					>
						<v-icon start>{{
							isPaused ? 'mdi-play-circle' : 'mdi-pause-circle'
						}}</v-icon>
						{{ isPaused ? 'Resume' : 'Pause' }}
					</v-btn>
				</v-col>

				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('rtl')"
				>
					<v-btn
						block
						variant="tonal"
						color="primary"
						@click="returnToLaunch"
						class="command-btn"
					>
						<v-icon start>mdi-home</v-icon>
						RTL
					</v-btn>
				</v-col>

				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('takeoff')"
				>
					<v-btn
						block
						variant="tonal"
						color="primary"
						@click="takeoffCommand"
						class="command-btn"
					>
						<v-icon start>mdi-airplane-takeoff</v-icon>
						Take Off
					</v-btn>
				</v-col>

				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('land')"
				>
					<v-btn
						block
						variant="tonal"
						color="warning"
						@click="land"
						class="command-btn"
					>
						<v-icon start>mdi-airplane-landing</v-icon>
						Land
					</v-btn>
				</v-col>

				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('cancel')"
				>
					<v-btn
						block
						variant="tonal"
						color="error"
						@click="cancel"
						class="command-btn"
					>
						<v-icon start>mdi-cancel</v-icon>
						Cancel
					</v-btn>
				</v-col>

				<v-col
					cols="6"
					md="3"
					v-if="getControlstreamByRole('reboot')"
				>
					<v-btn
						block
						variant="tonal"
						color="error"
						@click="reboot"
						class="command-btn"
					>
						<v-icon start>mdi-restart</v-icon>
						Reboot
					</v-btn>
				</v-col>
			</v-row>
		</div>

		<!--takeoff control-->
		<div v-if="getControlstreamByRole('takeoff')">
			<v-divider class="my-4"></v-divider>
			<div class="section-header mb-3">
				<v-icon size="small" class="mr-2">mdi-airplane</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Takeoff Control</span>
			</div>
			<v-row density="comfortable" align="center">
				<v-col
					cols="8"
					md="6"
				>
					<v-text-field
						v-model.number="takeOffAlt"
						type="number"
						label="Altitude (AGL)"
						density="compact"
						hide-details
						suffix="m"
					/>
				</v-col>
				<v-col
					cols="4"
					md="3"
				>
					<v-btn
						block
						variant="tonal"
						color="primary"
						@click="takeoffCommand"
						class="command-btn"
					>
						<v-icon start>mdi-airplane-takeoff</v-icon>
						Take Off
					</v-btn>
				</v-col>
			</v-row>
		</div>

		<!--drive velocity control-->
		<div v-if="getControlstreamByRole('driveVelocity')">
			<v-divider class="my-4"></v-divider>
			<div class="section-header mb-3">
				<v-icon size="small" class="mr-2">mdi-steering</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Drive Velocity Control</span>
			</div>
			<v-row density="comfortable" align="center">
				<v-col
					cols="5"
					md="4"
				>
					<v-text-field
						v-model.number="forwardVelocityDrive"
						type="number"
						label="Forward Velocity"
						density="compact"
						hide-details
					/>
				</v-col>
				<v-col
					cols="5"
					md="4"
				>
					<v-text-field
						v-model.number="yawRateDrive"
						type="number"
						label="Yaw Rate"
						density="compact"
						hide-details
					/>
				</v-col>
				<v-col
					cols="2"
					md="4"
				>
					<v-btn
						block
						variant="tonal"
						color="primary"
						@click="driveVelocityCommand"
						class="command-btn"
					>
						<v-icon start>mdi-send</v-icon>
						Send
					</v-btn>
				</v-col>
			</v-row>
		</div>

		<!--offboard control-->
		<div v-if="getControlstreamByRole('offboard')">
			<v-divider class="my-4"></v-divider>
			<div class="section-header mb-3">
				<v-icon size="small" class="mr-2">mdi-controller</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Offboard Control</span>
			</div>
			<v-form ref="offboardForm">
				<v-row density="comfortable" align="center">
					<v-col
						cols="6"
						md="2"
					>
						<v-text-field
							v-model.number="xVelocity"
							type="number"
							label="Vx"
							density="compact"
							hide-details
						/>
					</v-col>
					<v-col
						cols="6"
						md="2"
					>
						<v-text-field
							v-model.number="yVelocity"
							type="number"
							label="Vy"
							density="compact"
							hide-details
						/>
					</v-col>
					<v-col
						cols="6"
						md="2"
					>
						<v-text-field
							v-model.number="zVelocity"
							type="number"
							label="Vz"
							density="compact"
							hide-details
						/>
					</v-col>
					<v-col
						cols="6"
						md="2"
					>
						<v-text-field
							v-model.number="yawRate"
							type="number"
							label="Yaw"
							density="compact"
							hide-details
						/>
					</v-col>
					<v-col
						cols="12"
						md="4"
					>
						<v-btn
							block
							variant="tonal"
							color="primary"
							@click="offboard"
							class="command-btn"
						>
							<v-icon start>mdi-send</v-icon>
							Send
						</v-btn>
					</v-col>
				</v-row>
			</v-form>
		</div>

		<!--drive to location-->
		<div v-if="getControlstreamByRole('driveLocation')">
			<v-divider class="my-4"></v-divider>
			<div class="section-header mb-3">
				<v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
				<span class="text-subtitle-2 font-weight-medium">Drive to Location</span>
			</div>
			<v-row density="comfortable" align="center">
				<v-col cols="auto">
					<IconButton
						:color="isDriveLocationMapSelect ? 'primary' : 'grey'"
						@click="toggleDriveLocationSelect"
						rounded="xl"
					>
						<v-icon>{{
							isDriveLocationMapSelect ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'
						}}</v-icon>
						<v-tooltip
							activator="parent"
							location="top"
						>
							{{ isDriveLocationMapSelect ? 'Click map to set location' : 'Enable map selection' }}
						</v-tooltip>
					</IconButton>
				</v-col>
				<v-col
					cols="4"
					md="4"
				>
					<v-text-field
						v-model.number="driveLat"
						type="number"
						label="Latitude"
						density="compact"
						hide-details
					/>
				</v-col>
				<v-col
					cols="4"
					md="4"
				>
					<v-text-field
						v-model.number="driveLon"
						type="number"
						label="Longitude"
						density="compact"
						hide-details
					/>
				</v-col>
				<v-col
					cols="3"
					md="3"
				>
					<v-btn
						block
						variant="tonal"
						color="primary"
						@click="driveLocationCommand"
						class="command-btn"
					>
						<v-icon start>mdi-send</v-icon>
						Send
					</v-btn>
				</v-col>
			</v-row>
		</div>
	</div>
</template>

<style scoped>
.section-header {
	display: flex;
	align-items: center;
	opacity: 0.8;
}

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
