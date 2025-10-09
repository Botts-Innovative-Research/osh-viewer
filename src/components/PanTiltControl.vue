<script setup lang="ts">
import { Direction, Command } from '@/types/types';
import { computed, ref } from 'vue';

interface PanTiltControlProps {
  onSend: (command: Command) => void;
}

const props = defineProps<PanTiltControlProps>();

// Handle text input command sending
function sendCommand() {
  let command: Command | null = null;

  if (isAbsolute.value) {
    command = {
      params: {
        absolute: {
          pan: absPan.value ?? 0.0,
          tilt: absTilt.value ?? 0.0,
          zoom: absZoom.value ?? 0.0
        }
      }
    };
  } else if (singleValue.value != null) {
    command = { params: { [selectedCommand.value]: singleValue.value } } as Command;
    console.log("COMMAND COMMAND:", command)
  }

  if (command) {
    console.log('PanTiltControl: Sending command', command);
    props.onSend(command);
  } else {
    console.warn('PanTiltControl: No command to send');
  }
}

// Handle button-based movement commands
function handleMove(direction: Direction) {
  let command: Command | null = null;

  switch (direction) {
    case "right":
      command = { params: { rpan: increment.value } };
      break;
    case "left":
      command = { params: { rpan: -increment.value } };
      break;
    case "up":
      command = { params: { rtilt: increment.value } };
      break;
    case "down":
      command = { params: { rtilt: -increment.value } };
      break;
    case "zoomIn":
      command = { params: { rzoom: increment.value } };
      break;
    case "zoomOut":
      command = { params: { rzoom: -increment.value } };
      break;
    case "home":
      command = { params: { preset: "Home" } };
      break;
    default:
      return;
  }

  if (command) {
    console.log('PanTiltControl: Sending command', command);
    props.onSend(command);
  }
}

// Used for positioning buttons in a circle
const buttonConfig = [
  { dir: "right", angle: 0, rot: 90, scale: 1 },
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

// Input properties
const commandOptions = ['rpan', 'rtilt', 'rzoom', 'pan', 'tilt', 'zoom', 'preset', 'absolute'];
const selectedCommand = ref<typeof commandOptions[number]>('rpan');

const singleValue = ref<number>(0.0);
const absPan = ref<number>(0.0);
const absTilt = ref<number>(0.0);
const absZoom = ref<number>(0.0);
const increment = ref(5.0); // Default increment for relative commands

const isAbsolute = computed(() => selectedCommand.value === 'absolute');

</script>

<template>
  <div class="wrapper">
    <div class="controlPadWrapper">
      <div class="controlPadContainer">
        <button v-for="({ dir, angle, rot, scale }, index) in buttonConfig" :key="dir" @mousedown="handleMove(dir)"
          class="button" :style="{
            left: `${center - 25 + (radius * Math.cos(angle * Math.PI / 180))}px`,
            top: `${center - 25 + (radius * Math.sin(angle * Math.PI / 180))}px`,
            scale: scale,
            zIndex: 1000,
          }">
          <img class="icon" :src="`/ptzIcons/${dir}.png`" :alt="`${dir}`" />
        </button>
        <button class="homeButton" @click="handleMove('home')">
          <img class="homeIcon" src="/ptzIcons/home.png" alt="home" />
        </button>
      </div>
      <v-text-field v-model.number="increment" type="number" label="Increment" placeholder="5.0" />

    </div>
    <div class="">
      <div class="tasking-section">
        <v-select v-model="selectedCommand" :items="commandOptions" label="Command Type" class="command-select" />

        <div v-if="!isAbsolute" class="input-section">
          <v-text-field v-model.number="singleValue" type="number" :label="selectedCommand" placeholder="Enter value" />
        </div>

        <div v-else class="absolute-inputs">
          <v-text-field v-model.number="absPan" type="number" label="Pan" placeholder="0.0" />
          <v-text-field v-model.number="absTilt" type="number" label="Tilt" placeholder="0.0" />
          <v-text-field v-model.number="absZoom" type="number" label="Zoom" placeholder="0.0" />
        </div>

        <v-btn color="primary" @click="sendCommand">Send</v-btn>
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
  box-shadow: inset 2px 2px 6px rgba(255, 255, 255, 0.6), inset -2px -2px 6px rgba(0, 0, 0, 0.2), 0 0 8px rgba(0, 0, 0, 0.15);
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
  box-shadow: inset 2px 2px 6px rgba(255, 255, 255, 0.6), inset -2px -2px 6px rgba(0, 0, 0, 0.2), 0 0 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #ccc;
  padding: 8px;
  cursor: pointer;
}

.homeIcon {
  width: 60px;
  height: 60px;
}
</style>