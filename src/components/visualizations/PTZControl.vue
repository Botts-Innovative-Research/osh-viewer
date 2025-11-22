<script setup lang="ts">
import { Direction } from '@/types/types';
import { computed, ref, watch } from 'vue';
import { useControlStreamStore } from '@/stores/controlstreamstore';
import { storeToRefs } from 'pinia';
import { showToast } from '@/composables/useToast';
import { sendCommand } from '@/lib/ControlstreamUtils';

interface PTZControlProps {
	commandBaseUrl: string;
	id: string;
}

const props = defineProps<PTZControlProps>();

// Handle text input command sending
function onSend() {
	let command = null;

	// Handle DataRecord type command
	if (isDataRecord.value) {
		command = {
			params: {
				// Use selected command as key
				// Use computed default values or fallback to 0.0
				[selectedCommand.value]: {
					pan: absPan.value ?? 0.0,
					tilt: absTilt.value ?? 0.0,
					zoom: absZoom.value ?? 0.0,
				},
			},
		};
	}
	// Handle preset or other single value commands
	else if (singleValue.value != null) {
		const value =
			selectedCommand.value === 'preset'
				? String(singleValue.value)
				: Number(singleValue.value);

		command = { params: { [selectedCommand.value]: value } };
		console.log('COMMAND COMMAND:', command);
	}
	// If successfully constructed command, send it
	if (command) {
		console.log('PanTiltControl: Sending command', command);
		sendCommand(props.commandBaseUrl, props.id, command);
	} else {
		console.warn('PanTiltControl: No command to send');
	}
}

// Handle button-based movement commands for relative control
function handleMove(direction: Direction) {
	let command = null;

	switch (direction) {
		case 'right':
			command = { params: { rpan: increment.value } };
			break;
		case 'left':
			command = { params: { rpan: -increment.value } };
			break;
		case 'up':
			command = { params: { rtilt: increment.value } };
			break;
		case 'down':
			command = { params: { rtilt: -increment.value } };
			break;
		case 'zoomIn':
			command = { params: { rzoom: increment.value } };
			break;
		case 'zoomOut':
			command = { params: { rzoom: -increment.value } };
			break;
		case 'home':
			if (presetOptions.value.includes('Home')) command = { params: { preset: 'Home' } };
			else {
				console.error('Home preset not available.');
				showToast('Home preset is not available.', 'ERROR');
			}
			break;
		default:
			return;
	}

	if (command) {
		console.log('PanTiltControl: Sending command', command);
		sendCommand(props.commandBaseUrl, props.id, command);
	}
}

// Used for positioning buttons in a circle
const buttonConfig = [
	{ dir: 'right', angle: 0, rot: 90, scale: 1 },
	// { dir: 'down-right', angle: 45,  rot: 135, scale: 1 },
	{ dir: 'zoomIn', angle: 45, rot: 135, scale: 0.75 },
	{ dir: 'down', angle: 90, rot: 180, scale: 1 },
	// { dir: 'down-left', angle: 135, rot: 235, scale: 1 },
	{ dir: 'zoomOut', angle: 135, rot: 235, scale: 0.75 },
	{ dir: 'left', angle: 180, rot: 270, scale: 1 },
	// { dir: 'up-left', angle: 225, rot: 315, scale: 1 },
	{ dir: 'up', angle: 270, rot: 0, scale: 1 },
	// { dir: 'up-right', angle: 315, rot: 45, scale: 1 },
] as const;
const containerSize = 200;
const radius = 75;
const center = containerSize / 2;

/***************************** INPUT PROPERTIES *****************************/
const controlStreamStore = useControlStreamStore();
const { schemas } = storeToRefs(controlStreamStore);
const controlStreamSchema = computed(() => schemas.value[props.id]?.schema || {});
const controlStreamType = computed(() => schemas.value[props.id]?.type || {});

// List of command options based on schema
const commandOptions = computed(() => {
	console.log('Control Stream Schema:', Object.keys(controlStreamSchema.value));
	return Object.keys(controlStreamSchema.value);
});

// Selected command type
const selectedCommand = ref(commandOptions?.value[0] || '');
watch(
	commandOptions,
	(newOptions) => {
		if (!newOptions.includes(selectedCommand.value)) {
			selectedCommand.value = newOptions[0] || '';
		}
	},
	{ immediate: true }
);

// Check if schema has relative commands
const hasRelative = computed(() => {
	return controlStreamType.value.details?.hasRelative;
});
// Check if schema has preset command
const hasPreset = computed(() => {
	return controlStreamType.value.details?.hasPreset;
});
// Check if schema has data record command
const hasDataRecord = computed(() => {
	return controlStreamType.value.details?.hasDataRecord;
});

// Check if selected command is data record or preset
const isDataRecord = computed(() => {
	if (hasDataRecord.value)
		return controlStreamSchema.value[selectedCommand.value]?.type === 'DataRecord';
});
const isPreset = computed(() => {
	if (hasPreset.value) return selectedCommand.value === 'preset';
});
// Populate preset options from schema, if applicable
const presetOptions = computed(() => {
	if (hasPreset.value) {
		return controlStreamSchema.value['preset']?.values || [];
	}
});
// Reset singleValue when selectedCommand changes to preset or others
watch(selectedCommand, (newCommand) => {
	console.log('[PanTiltControl] selectedCommand changed:', newCommand);
	if (newCommand === 'preset' && hasPreset.value)
		singleValue.value = presetOptions.value ? presetOptions.value[0] : '';
	else singleValue.value = 0.0;
});

// Default values for manual input commands
const singleValue = ref<number | string>(0.0);
// Values for data record inputs
const absPan = ref<number>(0.0);
const absTilt = ref<number>(0.0);
const absZoom = ref<number>(0.0);
// Default increment for relative commands
const increment = ref(5.0);

watch(controlStreamType, (newVal) => {
	console.log('[PanTiltControl] controlStreamType changed:', newVal);
});
</script>

<template>
	<div class="wrapper">
		<div class="controlPadWrapper" v-if="hasRelative">
			<div class="controlPadContainer">
				<button
					v-for="({ dir, angle, rot, scale }, index) in buttonConfig"
					:key="dir"
					@mousedown="handleMove(dir)"
					class="button"
					:style="{
						left: `${center - 25 + radius * Math.cos((angle * Math.PI) / 180)}px`,
						top: `${center - 25 + radius * Math.sin((angle * Math.PI) / 180)}px`,
						scale: scale,
						zIndex: 1000,
					}"
				>
					<img class="icon" :src="`/ptzIcons/${dir}.png`" :alt="`${dir}`" />
				</button>
				<button class="homeButton" @click="handleMove('home')">
					<img class="homeIcon" src="/ptzIcons/home.png" alt="home" />
				</button>
			</div>
			<v-text-field
				v-model.number="increment"
				type="number"
				label="Increment"
				placeholder="5.0"
			/>
		</div>
		<div class="">
			<div class="tasking-section">
				<v-select
					v-model="selectedCommand"
					:items="commandOptions"
					label="Command Type"
					class="command-select"
				/>

				<div v-if="isDataRecord" class="absolute-inputs">
					<v-text-field
						v-model.number="absPan"
						type="number"
						label="Pan"
						placeholder="0.0"
					/>
					<v-text-field
						v-model.number="absTilt"
						type="number"
						label="Tilt"
						placeholder="0.0"
					/>
					<v-text-field
						v-model.number="absZoom"
						type="number"
						label="Zoom"
						placeholder="0.0"
					/>
				</div>

				<div v-else-if="isPreset" class="preset-section">
					<v-select
						v-if="presetOptions"
						v-model="singleValue"
						:items="presetOptions"
						label="Preset"
						:placeholder="presetOptions[0]"
					/>
				</div>

				<div v-else class="input-section">
					<v-text-field
						v-model="singleValue"
						type="number"
						:label="selectedCommand"
						placeholder="Enter value"
					/>
				</div>

				<v-btn color="primary" @click="onSend">Send</v-btn>
			</div>
		</div>
	</div>
</template>

<style scoped>
.wrapper {
	display: flex;
	justify-content: center;
	align-items: center;
}

.controlPadWrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.controlPadContainer {
	position: relative;
	width: 200px;
	height: 200px;
	border-radius: 50%;
	background: none;
	background-repeat: no-repeat;
	background-size: cover;
	box-shadow:
		inset 2px 2px 6px rgba(255, 255, 255, 0.6),
		inset -2px -2px 6px rgba(0, 0, 0, 0.2),
		0 0 8px rgba(0, 0, 0, 0.15);
	border: 1px solid #888;
}

.button {
	position: absolute;
	border: none;
	background: transparent;
	cursor: pointer;
	padding: 4px;
}

.icon {
	width: 48px;
	height: 48px;
}

.homeButton {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: none;
	background-repeat: no-repeat;
	background-size: cover;
	border-radius: 50%;
	box-shadow:
		inset 2px 2px 6px rgba(255, 255, 255, 0.6),
		inset -2px -2px 6px rgba(0, 0, 0, 0.2),
		0 0 8px rgba(0, 0, 0, 0.15);
	border: 1px solid #ccc;
	padding: 8px;
	cursor: pointer;
}

.homeIcon {
	width: 60px;
	height: 60px;
}
</style>
