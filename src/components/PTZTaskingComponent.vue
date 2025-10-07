<script setup lang="ts">
import PanTiltControl from './PanTiltControl.vue';

type Direction = "up" | "down" | "left" | "right" | "up-left" | "up-right" | "down-left" | "down-right" | "home" | "zoomIn" | "zoomOut";

function handleMove(direction: Direction) {

  let command: { params: { presetGoto: string } } | {
    params: { pan: number; tilt: number; zoom: number; }
  } = {
    params: { presetGoto: '1' }
  };

  if (direction === "home") {
    // sendCommand(PRESET_COMMAND_STREAM_ID, command);
    console.log('PanTiltControl: Home command sent');
  } else {
    let pan = 0;
    let tilt = 0;
    let zoom = 0;

    switch (direction) {
      case "right":
        pan -= 10;
        break;
      case "left":
        pan += 10;
        break;
      case "up":
        tilt += 10;
        break;
      case "down":
        tilt -= 10;
        break;
      case "up-left":
        pan += 10;
        tilt += 10;
        break;
      case "up-right":
        pan -= 10;
        tilt += 10;
        break;
      case "down-left":
        pan += 10;
        tilt -= 10;
        break;
      case "down-right":
        pan -= 10;
        tilt -= 10;
        break;
      case "zoomIn":
        zoom += 10;
        break;
      case "zoomOut":
        zoom -= 10;
        break;
      default:
        break;
    }

    let command: { params: { pan: number; tilt: number; zoom: number; } } = {
      params: { pan, tilt, zoom }
    };

    //sendCommand(COMMAND_STREAM_ID, command);
    console.log('PanTiltControl: Pan/Tilt/Zoom command sent', command);
  }
}

function handleStop() {

  const command = {
    params: { pan: 0, tilt: 0, zoom: 0 }
  };

  sendCommand("test", command);
  console.log('PanTiltControl: Stop command sent', command);
}

const command = {

}

function sendCommand(commandId: string, command: { params: { presetGoto: string } } | { params: { pan: number; tilt: number; zoom: number; } }) {
  console.log(`Sending command to ${commandId}:`, command);

  // Placeholder for actual command sending logic
  fetch(`http://localhost:8181/sensorhub/api/controlstreams/b5omtehh2upa0/commands`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      params: {
        rpan: 10.0,
      }
    })
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


//   // control stream ID
//   fetch(`http://localhost:8181/sensorhub/api/controlstreams/${controlstreamID}/commands`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(command)
//   }).then(response => {
//     if (!response.ok) {
//       throw new Error('API call failed: ' + response.statusText);
//     }
//     return response.json();
//   }).then(data => {
//     console.log('Camera pan/tilt successful: ', data);
//   }).catch(error => {
//     console.error('Error sending command: ', error);
//   })
}

</script>

<template>
  <PanTiltControl :onMove="handleMove" :onStop="handleStop" />
</template>

<style scoped>
</style>