<script setup lang="ts">
import { Direction } from '@/types/types';

interface PanTiltControlProps {
  onMove: (direction: Direction) => void;
  onStop: () => void;
}

const props = defineProps<PanTiltControlProps>();

function handleMove(direction: Direction) {
  props.onMove(direction);
}

function handleStop() {
  props.onStop();
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

</script>

<template>
  <div class="wrapper">
    <div class="container">
      <button v-for="({ dir, angle, rot, scale }, index) in buttonConfig" :key="dir" @mousedown="handleMove(dir)"
        @mouseup="handleStop" class="button" :style="{
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
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 250px;
}

.container {
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