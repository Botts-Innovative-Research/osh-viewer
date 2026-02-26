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
  auth: string
}

const props = defineProps<PTZControlProps>();

// Handle text input command sending
function onSend() {
	let command = null;

	// Handle DataRecord type command
	if (isDataRecord.value) {
		command = {
			parameters: {
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

		command = { parameters: { [selectedCommand.value]: value } };
		console.log('COMMAND:', command);
	}
	// If successfully constructed command, send it
	if (command) {
		console.log('PanTiltControl: Sending command', command);
		sendCommand(props.commandBaseUrl, props.id, command, props.auth);
	} else {
		console.warn('PanTiltControl: No command to send');
	}
}

// Handle button-based movement commands for relative control
function handleMove(direction: Direction) {
	let command = null;

	switch (direction) {
		case 'right':
			command = { parameters: { rpan: increment.value } };
			break;
		case 'left':
			command = { parameters: { rpan: -increment.value } };
			break;
		case 'up':
			command = { parameters: { rtilt: increment.value } };
			break;
		case 'down':
			command = { parameters: { rtilt: -increment.value } };
			break;
		case 'zoomIn':
			command = { parameters: { rzoom: increment.value } };
			break;
		case 'zoomOut':
			command = { parameters: { rzoom: -increment.value } };
			break;
		case 'home':
			if (presetOptions.value.includes('Home')) command = { parameters: { preset: 'Home' } };
			else {
				console.error('Home preset not available.');
				showToast('Home preset is not available.', 'ERROR');
			}
			break;
		default:
			return;
	}

	if (command) {
		console.log('PanTiltControl: Sending command', command, props.auth);
		sendCommand(props.commandBaseUrl, props.id, command, props.auth);
	}
}

// Used for positioning buttons in a circle
const buttonConfig = [
	{ dir: 'right', angle: 0, rot: 90, scale: 1 },
	// { dir: 'down-right', angle: 45,  rot: 135, scale: 1 },
	{ dir: 'plus', angle: 45, rot: 135, scale: 0.65 },
	{ dir: 'down', angle: 90, rot: 180, scale: 1 },
	// { dir: 'down-left', angle: 135, rot: 235, scale: 1 },
	{ dir: 'minus', angle: 135, rot: 235, scale: 0.65 },
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
const controlStreamSchema = computed(() => controlStreamStore.getCSSchemaById(props.id) || {});
const controlStreamType = computed(() => controlStreamStore.getCSTypeById(props.id) || {});

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
const increment = ref(10.0);

// Compute constraints for absolute commands
const constraints = computed(() => {
	let minPan, maxPan, minTilt, maxTilt, minZoom, maxZoom = 0;
	if (controlStreamSchema.value.pan) {
		minPan = controlStreamSchema.value.pan.constraint[0]
		maxPan = controlStreamSchema.value.pan.constraint[1]
	}
	if (controlStreamSchema.value.tilt) {
		minTilt = controlStreamSchema.value.tilt.constraint[0]
		maxTilt = controlStreamSchema.value.tilt.constraint[1]
	}
	if (controlStreamSchema.value.zoom) {
		minZoom = controlStreamSchema.value.zoom.constraint[0]
		maxZoom = controlStreamSchema.value.zoom.constraint[1]
	}
	return { minPan, maxPan, minTilt, maxTilt, minZoom, maxZoom }
})

const constraintTooltip = computed(() => {
    if (selectedCommand.value === 'pan') return `Min: ${constraints.value.minPan}, Max: ${constraints.value.maxPan}`
    	else if (selectedCommand.value === 'tilt') return `Min: ${constraints.value.minTilt}, Max: ${constraints.value.maxTilt}`
    	else if (selectedCommand.value === 'zoom') return `Min: ${constraints.value.minZoom}, Max: ${constraints.value.maxZoom}`
    	else return ``
})

</script>

<template>
	<v-container class="controlsContainer">
		<v-sheet v-if="hasRelative" class="wrapper">
			<v-container class="controlPadContainer">
				<v-btn
					:icon="dir === 'minus' || dir === 'plus' ? `mdi-${dir}-circle` : `mdi-arrow-${dir}-drop-circle`" 
					:alt="`${dir}`"
					v-for="({ dir, angle, scale }) in buttonConfig"
					:key="dir"
					@mousedown="handleMove(dir === 'minus' ? 'zoomOut' : dir === 'plus' ? 'zoomIn' : dir)"
					class="button"
					:style="{
						left: `${center - 25 + radius * Math.cos((angle * Math.PI) / 180)}px`,
						top: `${center - 25 + radius * Math.sin((angle * Math.PI) / 180)}px`,
						scale: scale,
						zIndex: 1000,
						fontSize: '35px',
					}"
					variant="text"
				></v-btn>
				<v-btn icon="mdi-home-circle" alt="home" @click="handleMove('home')" class="homeButton" variant="text" :style="{zIndex: 1000, fontSize: '35px'}"></v-btn>
			</v-container>
                <v-text-field
                  v-model.number="increment"
                  type="number"
                  label="Increment"
                />


		</v-sheet>
		<v-sheet class="wrapper">
			<v-select
				v-model="selectedCommand"
				:items="commandOptions"
				label="Command Type"
				class="w-100"
			/>
			<div v-if="isDataRecord">
			<v-tooltip :text="`min: ${constraints.minPan}, max: ${constraints.maxPan}`">
                <template #activator="{ props }">
                    <v-text-field
                        v-model.number="absPan"
                        type="number"
                        label="Pan"
                        placeholder="0.0"
                        class="w-100"
                        :min="constraints.minPan"
                        :max="constraints.maxPan"
                        v-bind="props"
                    />
                </template>
            </v-tooltip>
            <v-tooltip :text="`min: ${constraints.minTilt}, max: ${constraints.maxTilt}`">
                <template #activator="{ props }">
                    <v-text-field
                        v-model.number="absTilt"
                        type="number"
                        label="Tilt"
                        placeholder="0.0"
                        class="w-100"
                        :min="constraints.minTilt"
                        :max="constraints.maxTilt"
                        v-bind="props"
                    />
                </template>
            </v-tooltip>
            <v-tooltip :text="`min: ${constraints.minZoom}, max: ${constraints.maxZoom}`">
                <template #activator="{ props }">
                    <v-text-field
                        v-model.number="absZoom"
                        type="number"
                        label="Zoom"
                        placeholder="0.0"
                        class="w-100"
                        :min="constraints.minZoom"
                        :max="constraints.maxZoom"
                        v-bind="props"
                    />
                </template>
            </v-tooltip>
			</div>

			<div v-else-if="isPreset">
				<v-select
					v-if="presetOptions"
					v-model="singleValue"
					:items="presetOptions"
					label="Preset"
					:placeholder="presetOptions[0]"
					class="w-100"
				/>
			</div>

			<div v-else>
			<v-tooltip :text="constraintTooltip" :disabled="!constraintTooltip">
                <template #activator="{ props }">
                    <v-text-field
                        v-model="singleValue"
                        type="number"
                        :label="selectedCommand"
                        placeholder="Enter value"
                        class="w-100"
                        :min="selectedCommand === 'pan' ? constraints.minPan : selectedCommand === 'tilt' ? constraints.minTilt : constraints.minZoom"
                        :max="selectedCommand === 'pan' ? constraints.maxPan : selectedCommand === 'tilt' ? constraints.maxTilt : constraints.maxZoom"
                        v-bind="props"
                    />
                </template>
            </v-tooltip>
			</div>
			<v-btn color="primary" @click="onSend" block>Send</v-btn>
		</v-sheet>
	</v-container>
</template>

<style scoped>
.controlsContainer {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 5%;
}

.wrapper {
	display: flex;
	flex-direction: column;
	justify-content: center;
	width: 100%;
	height: auto;
}

.controlPadContainer {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 200px;
	height: 200px;
	border-radius: 50%;
	border: 1px solid #888;
	margin-bottom: 5%;
}

.button {
	position: absolute;
	border: none;
	background: transparent;
	padding: 0px;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
}

.homeButton {
	position: absolute;
	display: flex;
	cursor: pointer;
}
</style>