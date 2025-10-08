<script setup lang="ts">
import PanTiltControl from './PanTiltControl.vue';
import { Direction } from '@/types/types';
import { Command } from '@/types/types';

// Take in the control stream ID as a prop
const props = defineProps<{ commandBaseUrl: string, controlStreamID: string }>();

function handleMove(direction: Direction) {

  let command: Command;

  switch (direction) {
    case "right":
      command = { params: { rpan: 5.0 } };
      break;
    case "left":
      command = { params: { rpan: -5.0 } };
      break;
    case "up":
      command = { params: { rtilt: 5.0 } };
      break;
    case "down":
      command = { params: { rtilt: -5.0 } };
      break;
    case "zoomIn":
      command = { params: { rzoom: 3.0 } };
      break;
    case "zoomOut":
      command = { params: { rzoom: -3.0 } };
      break;
    case "home":
      command = { params: { preset: "1" } };
      break;
    default:
      return;
  }

    sendCommand(command);
    console.log('PanTiltControl: Pan/Tilt/Zoom command sent', command);
}

function handleStop() {
  console.log('PanTiltControl: Stop command sent', command);
}

const command = {

}

function sendCommand(command: Command) {
  console.log(`Sending command to ${props.commandBaseUrl}/controlstreams/${props.controlStreamID}/commands: `, command);

  // Command sending logic
  fetch(`http://localhost:8181/sensorhub/api/controlstreams/7nmmockh9ea96/commands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  }).then(response => {
    if (!response.ok) {
      throw new Error('API call failed: ' + response.statusText);
    }
    return response.json();
  }).then(data => {
    console.log('Camera pan/tilt successful: ', data);
  }).catch(error => {
    console.error('Error sending command: ', error);
  })
}

</script>

<template>
  <PanTiltControl :onMove="handleMove" :onStop="handleStop" />
</template>

<style scoped></style>